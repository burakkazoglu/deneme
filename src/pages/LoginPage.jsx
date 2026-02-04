import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const LoginPage = ({ error = '', logoUrl = '' }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding={3}
      sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)' }}
    >
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        sx={{ width: 'min(420px, 100%)', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.15)' }}
      >
        <CardContent>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            textAlign="center"
            mb={3}
          >
            <img src={logoUrl} alt="Influencer Planner" style={{ width: 64, marginBottom: 12 }} />
            <Typography variant="h5" fontWeight={600}>
              Influencer Planner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin paneline hoş geldiniz.
            </Typography>
          </Box>
          {error ? (
            <Box mb={2} p={1.5} borderRadius={2} sx={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {error}
            </Box>
          ) : null}
          <form action="/login" method="POST" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="E-posta" name="email" type="email" required fullWidth />
              <TextField label="Şifre" name="password" type="password" required fullWidth />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </Stack>
          </form>
          <Box mt={3} textAlign="center">
            <Typography variant="caption" color="text.secondary" display="block">
              Demo admin: admin@planner.local / admin123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Demo influencer: influencer@planner.local / infl123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
