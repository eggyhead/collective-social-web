import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Flex, Spinner, Center } from '@chakra-ui/react';
import { Provider } from './components/ui/provider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { consumePostLoginRedirect } from './utils/authRedirect';
import './App.css';

// Lazy-loaded page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const CollectionsPage = lazy(() =>
  import('./pages/CollectionsPage').then(m => ({ default: m.CollectionsPage }))
);
const CollectionDetailsPage = lazy(() =>
  import('./pages/CollectionDetailsPage').then(m => ({ default: m.CollectionDetailsPage }))
);
const GroupsPage = lazy(() => import('./pages/GroupsPage').then(m => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() =>
  import('./pages/GroupDetailPage').then(m => ({ default: m.GroupDetailPage }))
);
const GroupListDetailPage = lazy(() =>
  import('./pages/GroupListDetailPage').then(m => ({ default: m.GroupListDetailPage }))
);
const GroupItemDetailPage = lazy(() =>
  import('./pages/GroupItemDetailPage').then(m => ({ default: m.GroupItemDetailPage }))
);
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage }))
);
const GoalsPage = lazy(() => import('./pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const ItemDetailsPage = lazy(() =>
  import('./pages/ItemDetailsPage').then(m => ({ default: m.ItemDetailsPage }))
);
const SearchResultsPage = lazy(() =>
  import('./pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage }))
);
const TagSearchPage = lazy(() =>
  import('./pages/TagSearchPage').then(m => ({ default: m.TagSearchPage }))
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage }))
);
const AdminUserFeedbackPage = lazy(() =>
  import('./pages/admin/AdminUserFeedbackPage').then(m => ({ default: m.AdminUserFeedbackPage }))
);
const AdminMediaItemsPage = lazy(() =>
  import('./pages/admin/AdminMediaItemsPage').then(m => ({ default: m.AdminMediaItemsPage }))
);
const AdminShareLinksPage = lazy(() =>
  import('./pages/admin/AdminShareLinksPage').then(m => ({ default: m.AdminShareLinksPage }))
);
const AdminTagsPage = lazy(() =>
  import('./pages/admin/AdminTagsPage').then(m => ({ default: m.AdminTagsPage }))
);
const AdminTagReportsPage = lazy(() =>
  import('./pages/admin/AdminTagReportsPage').then(m => ({ default: m.AdminTagReportsPage }))
);
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage }))
);
const FeedbackPage = lazy(() =>
  import('./pages/FeedbackPage').then(m => ({ default: m.FeedbackPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const ShareRedirectPage = lazy(() =>
  import('./pages/ShareRedirectPage').then(m => ({ default: m.ShareRedirectPage }))
);

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

  useEffect(() => {
    // Check if user is authenticated
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include',
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
        setIsAuthenticated(true);

        // Check for pending share link after login
        const pendingShareLink = sessionStorage.getItem('pendingShareLink');
        if (pendingShareLink) {
          sessionStorage.removeItem('pendingShareLink');
          // Redirect to the share link page
          window.location.href = `/share/${pendingShareLink}`;
          return;
        }

        // Otherwise, if the user was bounced off a protected page (e.g. a
        // group's lists while logged out) send them back to where they were.
        const redirect = consumePostLoginRedirect();
        if (redirect && redirect.path && redirect.path !== window.location.pathname) {
          window.location.href = redirect.path;
        }
      })
      .catch(() => {
        setUser(null);
        setIsAuthenticated(false);
      });
  }, []);

  return (
    <Provider>
      <BrowserRouter>
        <Flex direction="column" minH="100vh" bg="bg.page">
          <Header user={user} isAuthenticated={!!isAuthenticated} apiUrl={apiUrl} />
          <Box
            as="main"
            flex="1"
            // Header is `position: fixed`, so main content needs top padding
            // to clear it. The logged-out header is actually slightly taller
            // (bigger logo + py={4}), so reserve at least as much space as
            // the authenticated state — otherwise the top of the page slides
            // under the header for unauthenticated visitors.
            pt={isAuthenticated ? '80px' : '96px'}
            pb={8}
            transition="padding-top 0.3s ease"
          >
            {isAuthenticated === null ? (
              <div className="card">Loading...</div>
            ) : (
              <Suspense
                fallback={
                  <Center py={12}>
                    <Spinner size="xl" color="accent.default" />
                  </Center>
                }
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <HomePage isAuthenticated={!!isAuthenticated} user={user} apiUrl={apiUrl} />
                    }
                  />
                  <Route path="/profile" element={<ProfilePage apiUrl={apiUrl} />} />
                  <Route path="/profile/:handle" element={<ProfilePage apiUrl={apiUrl} />} />
                  <Route path="/collections" element={<CollectionsPage apiUrl={apiUrl} />} />
                  <Route
                    path="/collections/:collectionUri"
                    element={<CollectionDetailsPage apiUrl={apiUrl} />}
                  />
                  <Route path="/goals" element={<GoalsPage apiUrl={apiUrl} />} />
                  <Route path="/groups" element={<GroupsPage apiUrl={apiUrl} />} />
                  <Route
                    path="/groups/:groupDid"
                    element={
                      <GroupDetailPage apiUrl={apiUrl} isAuthenticated={!!isAuthenticated} />
                    }
                  />
                  <Route
                    path="/groups/:groupDid/lists/:listRkey"
                    element={<GroupListDetailPage apiUrl={apiUrl} />}
                  />
                  <Route
                    path="/groups/:groupDid/lists/:listRkey/items/:itemRkey"
                    element={<GroupItemDetailPage apiUrl={apiUrl} />}
                  />
                  <Route
                    path="/groups/:groupDid/events/:eventRkey"
                    element={<EventDetailPage apiUrl={apiUrl} />}
                  />
                  <Route path="/search" element={<SearchResultsPage apiUrl={apiUrl} />} />
                  <Route path="/tags/:tagSlug" element={<TagSearchPage apiUrl={apiUrl} />} />
                  <Route path="/items/:itemId" element={<ItemDetailsPage apiUrl={apiUrl} />} />
                  <Route path="/admin" element={<AdminUsersPage apiUrl={apiUrl} />} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage apiUrl={apiUrl} />} />
                  <Route path="/admin/users" element={<AdminUsersPage apiUrl={apiUrl} />} />
                  <Route
                    path="/admin/user-feedback"
                    element={<AdminUserFeedbackPage apiUrl={apiUrl} />}
                  />
                  <Route
                    path="/admin/media-items"
                    element={<AdminMediaItemsPage apiUrl={apiUrl} />}
                  />
                  <Route
                    path="/admin/share-links"
                    element={<AdminShareLinksPage apiUrl={apiUrl} />}
                  />
                  <Route path="/admin/tags" element={<AdminTagsPage apiUrl={apiUrl} />} />
                  <Route path="/admin/tags" element={<AdminTagsPage apiUrl={apiUrl} />} />
                  <Route
                    path="/admin/tag-reports"
                    element={<AdminTagReportsPage apiUrl={apiUrl} />}
                  />
                  <Route path="/feedback" element={<FeedbackPage apiUrl={apiUrl} />} />
                  <Route path="/settings" element={<SettingsPage apiUrl={apiUrl} user={user} />} />
                  <Route path="/share/:shortCode" element={<ShareRedirectPage apiUrl={apiUrl} />} />
                </Routes>
              </Suspense>
            )}
          </Box>
          <Footer />
        </Flex>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
