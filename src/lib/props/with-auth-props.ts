import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { getLoggedInUser } from '~/core/firebase/admin/auth/get-logged-in-user';
import { withTranslationProps } from '~/lib/props/with-translation-props';
import { initializeFirebaseAdminApp } from '~/core/firebase/admin/initialize-firebase-admin-app';
import createCsrfToken from '~/core/generic/create-csrf-token';
import { signOutServerSession } from '~/core/session/sign-out-server-session';

import configuration from '~/configuration';

const DEFAULT_OPTIONS = {
  redirectPath: configuration.paths.appHome,
  locale: configuration.site.locale ?? 'en',
  localeNamespaces: [],
};

/**
 * @description A server props pipe to deny access to auth pages while logged in
 * For example, this is to be used in pages where logged-in users are not
 * supposes to see, like the sign in page
 * @param ctx
 * @param options
 */
export async function withAuthProps(
  ctx: GetServerSidePropsContext,
  options = DEFAULT_OPTIONS,
): Promise<GetServerSidePropsResult<unknown>> {
  try {
    await initializeFirebaseAdminApp();

    // sign out the user if the query param "signOut" is present
    if (ctx.query.signOut) {
      await signOutServerSession(ctx.req, ctx.res);

      return continueToAuthPage(ctx, options);
    }

    // test the user is logged in
    const checkRevoked = true;

    await getLoggedInUser(ctx, checkRevoked);

    // if yes, then redirect to "redirectPath"
    return {
      redirect: {
        permanent: false,
        destination: options.redirectPath,
      },
    };
  } catch (e) {
    // if the user is NOT logged in, we redirect to the authentication page
    // as requested by the user
    return continueToAuthPage(ctx, options);
  }
}

async function continueToAuthPage(
  ctx: GetServerSidePropsContext,
  options: typeof DEFAULT_OPTIONS,
): Promise<GetServerSidePropsResult<unknown>> {
  const { props } = await withTranslationProps({
    ...options,
    locale: ctx.locale ?? options.locale,
  });

  const csrfToken = await createCsrfToken(ctx);

  return {
    props: {
      ...props,
      csrfToken,
    },
  };
}
