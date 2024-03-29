import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext } from 'react';

import { Trans } from 'next-i18next';
import classNames from 'clsx';
import { cva } from 'cva';

import { isRouteActive } from '~/core/is-route-active';
import { NavigationMenuContext } from './NavigationMenuContext';

interface Link {
  path: string;
  label?: string;

  /**
   * @deprecated - Simply use {@link label}
   */
  i18n?: string;
}

const NavigationMenuItem: React.FCC<{
  link: Link;
  depth?: number;
  disabled?: boolean;
  shallow?: boolean;
  className?: string;
}> = ({ link, disabled, shallow, depth, ...props }) => {
  const router = useRouter();
  const active = isRouteActive(link.path, router.asPath, depth ?? 1);
  const menuProps = useContext(NavigationMenuContext);
  const label = link.label ?? link.i18n;

  const itemClassName = getNavigationMenuItemClassBuilder()({
    active,
    ...menuProps,
  });

  return (
    <li className={classNames(itemClassName, props.className ?? ``)}>
      <Link
        className={'transition-transform duration-500'}
        aria-disabled={disabled}
        href={disabled ? '' : link.path}
        shallow={shallow ?? active}
      >
        <Trans i18nKey={label} defaults={label} />
      </Link>
    </li>
  );
};

export default NavigationMenuItem;

function getNavigationMenuItemClassBuilder() {
  return cva(
    [
      `flex items-center justify-center font-medium lg:justify-start rounded-md text-sm transition colors transform active:*:translate-y-[2px]`,
      '*:p-1 *:lg:px-2.5 *:w-full *:h-full *:flex *:items-center',
    ],
    {
      compoundVariants: [
        // not active - shared
        {
          active: false,
          className: `active:text-current text-gray-600 dark:text-gray-300
        hover:text-current dark:hover:text-white`,
        },
        // active - shared
        {
          active: true,
          className: `text-gray-800 dark:text-white`,
        },
        // active - pill
        {
          active: true,
          pill: true,
          className: `bg-gray-50 text-gray-600 dark:bg-primary-300/10`,
        },
        // not active - pill
        {
          active: false,
          pill: true,
          className: `hover:bg-gray-50 active:bg-gray-100 text-gray-500 dark:text-gray-300 dark:hover:bg-background dark:active:bg-dark-900/90`,
        },
        // not active - bordered
        {
          active: false,
          bordered: true,
          className: `hover:bg-gray-50 active:bg-gray-100 dark:active:bg-dark-800 dark:hover:bg-dark/90 transition-colors rounded-lg border-transparent`,
        },
        // active - bordered
        {
          active: true,
          bordered: true,
          className: `top-[0.4rem] border-b-[0.25rem] rounded-none border-primary bg-transparent pb-[0.55rem] text-primary-700 dark:text-white`,
        },
        // active - secondary
        {
          active: true,
          secondary: true,
          className: `bg-transparent font-medium`,
        },
      ],
      variants: {
        active: {
          true: ``,
        },
        pill: {
          true: `[&>*]:py-2`,
        },
        bordered: {
          true: `relative h-10`,
        },
        secondary: {
          true: ``,
        },
      },
    },
  );
}
