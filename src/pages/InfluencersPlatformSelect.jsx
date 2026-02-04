import React, { useState } from 'react';
import { Chip, Stack } from '@mui/material';
import { SiInstagram, SiTiktok, SiX, SiYoutube } from 'react-icons/si';

const PLATFORM_OPTIONS = [
  { key: 'instagram', value: 'Instagram', label: 'Instagram', icon: SiInstagram },
  { key: 'tiktok', value: 'TikTok', label: 'TikTok', icon: SiTiktok },
  { key: 'youtube', value: 'YouTube', label: 'YouTube', icon: SiYoutube },
  { key: 'x', value: 'X', label: 'X', icon: SiX }
];

const InfluencersPlatformSelect = () => {
  const [platforms, setPlatforms] = useState([]);

  const togglePlatform = (value) => {
    setPlatforms((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {PLATFORM_OPTIONS.map((platform) => (
          <Chip
            key={platform.key}
            label={platform.label}
            icon={<platform.icon size={18} />}
            onClick={() => togglePlatform(platform.value)}
            variant={platforms.includes(platform.value) ? 'filled' : 'outlined'}
            color={platforms.includes(platform.value) ? 'primary' : 'default'}
            sx={{ height: 40, px: 1.25, borderRadius: 999 }}
          />
        ))}
      </Stack>
      <div>
        {platforms.map((value) => (
          <input key={value} type="hidden" name="platforms" value={value} />
        ))}
      </div>
    </>
  );
};

export default InfluencersPlatformSelect;
