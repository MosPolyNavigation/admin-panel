import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Typography,
  Card,
  CardOverflow,
  CardActions,
} from '@mui/joy';
import Page from '../components/Page.tsx';

export default function Profile() {
  return (
    <Page headerText="Мой профиль">
      <Card>
        <Box sx={{ mb: 1 }}>
          <Typography level="title-md">Персональная информация</Typography>
        </Box>
        <Divider />
        <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' }, my: 1 }}>
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            <Stack spacing={1}>
              <FormLabel>Имя</FormLabel>
              <FormControl sx={{ display: { sm: 'flex-column', md: 'flex-row' }, gap: 2 }}>
                <Input size="sm" placeholder="Имя" />
                <Input size="sm" placeholder="Фамилия" sx={{ flexGrow: 1 }} />
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl>
                <FormLabel>Роли</FormLabel>
                <Input size="sm" defaultValue="Админ" />
              </FormControl>
            </Stack>
          </Stack>
        </Stack>
        <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
            <Button size="sm" variant="outlined" color="neutral">
              Отменить
            </Button>
            <Button size="sm" variant="solid">
              Сохранить
            </Button>
          </CardActions>
        </CardOverflow>
      </Card>
    </Page>
  );
}
