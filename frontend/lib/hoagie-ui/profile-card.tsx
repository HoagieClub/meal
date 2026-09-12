import type { UserProfile } from '@auth0/nextjs-auth0/client';
import { Avatar, Button, Card, Heading, majorScale, Text, useTheme } from 'evergreen-ui';

/** Popover card showing the signed-in user's name and email, with a logout button. */
export default function ProfileCard({ user }: { user: UserProfile }) {
  const theme = useTheme();
  // Some identity providers only expose the email inside the `sub` claim.
  const email = user.email || (user.sub?.includes('@') ? user.sub.split('|').pop() : 'N/A');

  return (
    <Card
      elevation={1}
      background='gray50'
      padding={majorScale(3)}
      maxWidth={majorScale(30)}
      borderRadius={8}
      display='flex'
      flexDirection='column'
      alignItems='center'
    >
      <Avatar name={user.name} color={theme.title} size={40} />
      <Heading size={500} marginTop={majorScale(1)}>
        {user.name}
      </Heading>
      <Text color='muted' size={300} marginTop={2}>
        {email}
      </Text>
      <Button is='a' href='/api/auth/logout' marginTop={16}>
        Log Out
      </Button>
    </Card>
  );
}
