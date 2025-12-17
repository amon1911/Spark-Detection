import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, unit, color = '#fff', icon }) => {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: color }} />
      
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {title}
          </Typography>
          {icon && <Box color={color}>{icon}</Box>}
        </Box>
        
        <Box display="flex" alignItems="baseline">
          <Typography variant="h3" fontWeight="bold" sx={{ color: color }}>
            {value}
          </Typography>
          {unit && (
            <Typography variant="h6" color="textSecondary" ml={1}>
              {unit}
            </Typography>
          )}
        </Box>
        
        {/* Mock Trend */}
        <Box display="flex" alignItems="center" mt={1} color="success.main">
           <TrendingUpIcon fontSize="small" />
           <Typography variant="caption" ml={0.5}>+2.4% from last hour</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};