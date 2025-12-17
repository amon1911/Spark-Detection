import React from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { LogEntry } from '../../types';

interface Props {
  logs: LogEntry[];
}

export const EventLogTable: React.FC<Props> = ({ logs }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>System Event Logs</Typography>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Timestamp</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Type</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{log.timestamp}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.type} 
                      size="small" 
                      color={log.type === 'CRITICAL' ? 'error' : log.type === 'WARNING' ? 'warning' : 'default'} 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No events recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};