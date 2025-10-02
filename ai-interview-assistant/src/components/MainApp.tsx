import React from 'react';
import { Layout, Tabs } from 'antd';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setActiveTab } from '../store/slices/appSlice';
import IntervieweeTab from './IntervieweeTab';
import InterviewerTab from './InterviewerTab';
import AnalyticsTab from './AnalyticsTab';
import WelcomeBackModal from './WelcomeBackModal';

const { Header, Content } = Layout;

const MainApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTab, showWelcomeBackModal } = useAppSelector(state => state.app);

  const handleTabChange = (key: string) => {
    dispatch(setActiveTab(key as 'interviewee' | 'interviewer' | 'analytics'));
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>
          AI Interview Assistant
        </h1>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'interviewee',
              label: 'Interviewee',
              children: <IntervieweeTab />,
            },
            {
              key: 'interviewer',
              label: 'Interviewer Dashboard',
              children: <InterviewerTab />,
            },
            {
              key: 'analytics',
              label: 'Analytics',
              children: <AnalyticsTab />,
            },
          ]}
          size="large"
        />
      </Content>
      
      {showWelcomeBackModal && <WelcomeBackModal />}
    </Layout>
  );
};

export default MainApp;
