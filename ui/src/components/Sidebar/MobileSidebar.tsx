import React, { useState } from 'react';
import cn from 'classnames';
import { Outlet, useLocation, useMatch } from 'react-router';
import { Link } from 'react-router-dom';
import NavTab from '../NavTab';
import AppGroupsIcon from '../icons/AppGroupsIcon';
import ElipsisIcon from '../icons/EllipsisIcon';
import BellIcon from '../icons/BellIcon';
import Avatar from '../Avatar';
import Sheet, { SheetContent } from '../Sheet';
import MagnifyingGlassIcon from '../icons/MagnifyingGlass16Icon';
import AsteriskIcon from '../icons/Asterisk16Icon';
import SidebarItem from './SidebarItem';

export default function MobileSidebar() {
  const ship = window.our;
  const location = useLocation();
  const profileMatch = useMatch('/profile/edit');
  const [showSheet, setShowSheet] = useState(false);

  return (
    <section className="fixed inset-0 z-40 flex h-full w-full flex-col  border-gray-50 bg-white">
      <Outlet />
      <footer className="mobile-bottom-nav flex-none border-t-2 border-gray-50">
        <nav>
          <ul className="flex">
            <NavTab to="/" linkClass="basis-1/5">
              <AppGroupsIcon className="mb-0.5 h-6 w-6" />
              Groups
            </NavTab>
            <NavTab to="/notifications" linkClass="basis-1/5">
              <BellIcon className="mb-0.5 h-6 w-6" />
              Activity
            </NavTab>
            <NavTab to="/find" linkClass="basis-1/5">
              <MagnifyingGlassIcon className="mb-0.5 h-6 w-6" />
              Find Groups
            </NavTab>
            <NavTab to="/profile/edit" linkClass="basis-1/5">
              <Avatar
                size="xs"
                ship={ship}
                className={cn(
                  'mb-1 h-6 w-6',
                  !profileMatch && 'opacity-50 grayscale'
                )}
              />
              Profile
            </NavTab>
            <NavTab onClick={() => setShowSheet(true)} linkClass="basis-1/5">
              <ElipsisIcon className="mb-0.5 h-6 w-6" />
              Options
            </NavTab>
          </ul>
          <Sheet open={showSheet} onOpenChange={(o) => setShowSheet(o)}>
            <SheetContent containerClass="" showClose={true}>
              <SidebarItem
                icon={
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-50">
                    <AsteriskIcon className="h-6 w-6" />
                  </div>
                }
              >
                <a
                  className="no-underline"
                  href="https://airtable.com/shrflFkf5UyDFKhmW"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Submit Feedback"
                >
                  Submit Feedback
                </a>
              </SidebarItem>
              <SidebarItem
                icon={
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-50">
                    <AppGroupsIcon className="h-6 w-6" />
                  </div>
                }
              >
                <Link
                  to="/about"
                  className="no-underline"
                  state={{ backgroundLocation: location }}
                >
                  About Groups
                </Link>
              </SidebarItem>
            </SheetContent>
          </Sheet>
        </nav>
      </footer>
    </section>
  );
}
