// src/components/Dashboard.js

import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, CssBaseline, Button // Button をインポート
} from '@mui/material';
import { Checklist, Event, AccountBalanceWallet } from '@mui/icons-material';
import TodoList from './TodoList';
import EventCalendar from './Calendar'; 
import Transactions from './Transactions';
import { useAuth } from '../context/AuthContext'; // useAuthをインポート

const drawerWidth = 240;

const Dashboard = () => { 
  const { logout } = useAuth(); // useAuthからlogoutを取得
  const [selectedComponent, setSelectedComponent] = useState('todo');

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'todo':
        return <TodoList />;
      case 'calendar':
        return <EventCalendar />;
      case 'budget':
        return <Transactions />;
      default:
        return <TodoList />;
    }
  };

  const menuItems = [
    { text: 'ToDoリスト', icon: <Checklist />, component: 'todo' },
    { text: '日程管理', icon: <Event />, component: 'calendar' },
    { text: '家計簿', icon: <AccountBalanceWallet />, component: 'budget' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar>
          {/* Typographyに sx={{ flexGrow: 1 }} を追加してタイトルを左寄せ */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            皆の秘密基地
          </Typography>
          {/* ログアウトボタンを追加 */}
          <Button color="inherit" onClick={logout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => setSelectedComponent(item.component)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
        {renderComponent()}
      </Box>
    </Box>
  );
};

export default Dashboard;