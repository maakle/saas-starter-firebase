import { useCallback, useEffect, useRef, useState } from 'react';

import { Trans } from 'next-i18next';
import { useAuth } from 'reactfire';

import {
  browserPopupRedirectResolver,
  getRedirectResult,
  MultiFactorError,
  User,
  UserCredential,
} from 'firebase/auth';

import AuthProviderButton from '~/core/ui/AuthProviderButton';
import { useSignInWithProvider } from '~/core/firebase/hooks';
import { getFirebaseErrorCode } from '~/core/firebase/utils/get-firebase-error-code';

import If from '~/core/ui/If';
import LoadingOverlay from '~/core/ui/LoadingOverlay';

import AuthErrorMessage from './AuthErrorMessage';
import MultiFactorAuthChallengeModal from '~/components/auth/MultiFactorAuthChallengeModal';
import { isMultiFactorError } from '~/core/firebase/utils/is-multi-factor-error';
import useCreateServerSideSession from '~/core/hooks/use-create-server-side-session';

import configuration from '~/configuration';

const OAUTH_PROVIDERS = configuration.auth.providers.oAuth;

let didCheckRedirect = false;

const OAuthProviders: React.FCC<{
  onSignIn: () => unknown;
}> = ({ onSignIn }) => {
  const {
    signInWithProvider,
    state: signInWithProviderState,
    resetState,
  } = useSignInWithProvider();

  const [sessionRequest, sessionRequestState] = useCreateServerSideSession();
  const isSigningIn = useRef(false);

  // we make the UI "busy" until the next page is fully loaded
  const shouldDisplayLoading =
    signInWithProviderState.loading ||
    sessionRequestState.isMutating ||
    Boolean(sessionRequestState.data) ||
    isSigningIn.current;

  const [multiFactorAuthError, setMultiFactorAuthError] =
    useState<Maybe<MultiFactorError>>();

  const createSession = useCallback(
    async (user: User) => {
      if (isSigningIn.current) {
        return;
      }

      isSigningIn.current = true;

      try {
        await sessionRequest(user);

        onSignIn();
      } finally {
        isSigningIn.current = false;
      }
    },
    [sessionRequest, onSignIn],
  );

  const onSignInWithProvider = useCallback(
    async (signInRequest: () => Promise<UserCredential | undefined>) => {
      try {
        const credential = await signInRequest();

        if (!credential) {
          return Promise.reject();
        }

        if (!configuration.auth.useRedirectStrategy) {
          await createSession(credential.user);
        }
      } catch (error) {
        if (isMultiFactorError(error)) {
          setMultiFactorAuthError(error as MultiFactorError);
        } else {
          throw getFirebaseErrorCode(error);
        }
      }
    },
    [createSession],
  );

  if (!OAUTH_PROVIDERS || !OAUTH_PROVIDERS.length) {
    return null;
  }

  return (
    <>
      <RedirectCheckHandler onSignIn={createSession} />

      <If condition={shouldDisplayLoading}>
        <LoadingIndicator />
      </If>

      <div className={'flex w-full flex-1 flex-col space-y-3'}>
        <div className={'flex-col space-y-2'}>
          {OAUTH_PROVIDERS.map((OAuthProviderClass) => {
            const providerInstance = new OAuthProviderClass();
            const providerId = providerInstance.providerId;

            return (
              <AuthProviderButton
                key={providerId}
                providerId={providerId}
                onClick={() => {
                  return onSignInWithProvider(() =>
                    signInWithProvider(providerInstance),
                  );
                }}
              >
                <Trans
                  i18nKey={'auth:signInWithProvider'}
                  values={{
                    provider: getProviderName(providerId),
                  }}
                />
              </AuthProviderButton>
            );
          })}
        </div>

        <If
          condition={signInWithProviderState.error || sessionRequestState.error}
        >
          {(error) => <AuthErrorMessage error={getFirebaseErrorCode(error)} />}
        </If>
      </div>

      <If condition={multiFactorAuthError}>
        {(error) => (
          <MultiFactorAuthChallengeModal
            error={error}
            isOpen={true}
            setIsOpen={(isOpen: boolean) => {
              setMultiFactorAuthError(undefined);

              // when the MFA modal gets closed without verification
              // we reset the state
              if (!isOpen) {
                resetState();
              }
            }}
            onSuccess={async (credential) => {
              return createSession(credential.user);
            }}
          />
        )}
      </If>
    </>
  );
};

function RedirectCheckHandler({
  onSignIn,
}: {
  onSignIn: (user: User) => unknown;
}) {
  const auth = useAuth();
  const [checkingRedirect, setCheckingRedirect] = useState(false);

  useEffect(() => {
    async function checkRedirectSignIn() {
      if (didCheckRedirect) {
        return;
      }

      didCheckRedirect = true;
      setCheckingRedirect(true);

      try {
        const result = await getRedirectResult(
          auth,
          browserPopupRedirectResolver,
        );

        if (result) {
          onSignIn(result.user);
        } else {
          setCheckingRedirect(false);
        }
      } catch (e) {
        setCheckingRedirect(false);
        console.error(e);
      }
    }

    void checkRedirectSignIn();
  }, [auth, onSignIn]);

  if (checkingRedirect) {
    return <LoadingIndicator />;
  }

  return null;
}

function getProviderName(providerId: string) {
  const capitalize = (value: string) =>
    value.slice(0, 1).toUpperCase() + value.slice(1);

  if (providerId.endsWith('.com')) {
    return capitalize(providerId.split('.com')[0]);
  }

  return capitalize(providerId);
}

function LoadingIndicator() {
  return (
    <LoadingOverlay
      displayLogo={false}
      className={'m-0 !h-full !w-full rounded-xl'}
    >
      <Trans i18nKey={'auth:signingIn'} />
    </LoadingOverlay>
  );
}

export default OAuthProviders;
