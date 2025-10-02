import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Table, Tag, Space } from 'antd';
import { TrophyOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks/useAppSelector';
// Analytics component for performance metrics

const { Title, Text } = Typography;

const AnalyticsTab: React.FC = () => {
  const { candidates } = useAppSelector(state => state.app);

  const completedSessions = candidates.flatMap(c => c.completedSessions);
  const totalInterviews = completedSessions.length;
  const averageScore = completedSessions.length > 0 
    ? completedSessions.reduce((sum, session) => sum + (session.totalScore || 0), 0) / completedSessions.length 
    : 0;

  const difficultyStats = {
    easy: { total: 0, average: 0 },
    medium: { total: 0, average: 0 },
    hard: { total: 0, average: 0 }
  };

  completedSessions.forEach(session => {
    session.questions.forEach(q => {
      const difficulty = q.difficulty as keyof typeof difficultyStats;
      difficultyStats[difficulty].total++;
      difficultyStats[difficulty].average += q.score || 0;
    });
  });

  // Calculate averages
  Object.keys(difficultyStats).forEach(key => {
    const diff = key as keyof typeof difficultyStats;
    if (difficultyStats[diff].total > 0) {
      difficultyStats[diff].average = difficultyStats[diff].average / difficultyStats[diff].total;
    }
  });

  const topPerformers = candidates
    .filter(c => c.completedSessions.length > 0)
    .map(c => ({
      ...c,
      latestScore: c.completedSessions[c.completedSessions.length - 1].totalScore || 0
    }))
    .sort((a, b) => b.latestScore - a.latestScore)
    .slice(0, 5);

  const scoreDistribution = {
    excellent: candidates.filter(c => 
      c.completedSessions.length > 0 && 
      (c.completedSessions[c.completedSessions.length - 1].totalScore || 0) >= 80
    ).length,
    good: candidates.filter(c => 
      c.completedSessions.length > 0 && 
      (c.completedSessions[c.completedSessions.length - 1].totalScore || 0) >= 70 &&
      (c.completedSessions[c.completedSessions.length - 1].totalScore || 0) < 80
    ).length,
    needsImprovement: candidates.filter(c => 
      c.completedSessions.length > 0 && 
      (c.completedSessions[c.completedSessions.length - 1].totalScore || 0) < 70
    ).length,
  };

  const topPerformersColumns = [
    {
      title: 'Rank',
      key: 'rank',
      render: (_: any, __: any, index: number) => (
        <Space>
          {index === 0 && <TrophyOutlined style={{ color: '#faad14' }} />}
          {index === 1 && <TrophyOutlined style={{ color: '#c0c0c0' }} />}
          {index === 2 && <TrophyOutlined style={{ color: '#cd7f32' }} />}
          <span>{index + 1}</span>
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Score',
      dataIndex: 'latestScore',
      key: 'latestScore',
      render: (score: number) => (
        <Space>
          <Text strong style={{ color: score >= 80 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f' }}>
            {Math.round(score)}/100
          </Text>
          <Tag color={score >= 80 ? 'green' : score >= 70 ? 'orange' : 'red'}>
            {score >= 80 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
          </Tag>
        </Space>
      ),
      sorter: (a: any, b: any) => a.latestScore - b.latestScore,
    },
    {
      title: 'Interviews',
      key: 'interviewCount',
      render: (record: any) => record.completedSessions.length,
    },
  ];

  return (
    <div>
      <Title level={3}>📊 Analytics Dashboard</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={candidates.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Interviews"
              value={totalInterviews}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={Math.round(averageScore)}
              suffix="/100"
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={candidates.length > 0 ? Math.round((totalInterviews / candidates.length) * 100) : 0}
              suffix="%"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Score Distribution">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Excellent (80+)</Text>
                <Progress 
                  percent={candidates.length > 0 ? (scoreDistribution.excellent / candidates.length) * 100 : 0} 
                  strokeColor="#52c41a"
                  format={() => `${scoreDistribution.excellent} candidates`}
                />
              </div>
              <div>
                <Text>Good (70-79)</Text>
                <Progress 
                  percent={candidates.length > 0 ? (scoreDistribution.good / candidates.length) * 100 : 0} 
                  strokeColor="#faad14"
                  format={() => `${scoreDistribution.good} candidates`}
                />
              </div>
              <div>
                <Text>Needs Improvement (&lt;70)</Text>
                <Progress 
                  percent={candidates.length > 0 ? (scoreDistribution.needsImprovement / candidates.length) * 100 : 0} 
                  strokeColor="#ff4d4f"
                  format={() => `${scoreDistribution.needsImprovement} candidates`}
                />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Difficulty Performance">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Easy Questions</Text>
                <Progress 
                  percent={Math.round(difficultyStats.easy.average)} 
                  strokeColor="#52c41a"
                  format={() => `${Math.round(difficultyStats.easy.average)}/100 avg`}
                />
              </div>
              <div>
                <Text>Medium Questions</Text>
                <Progress 
                  percent={Math.round(difficultyStats.medium.average)} 
                  strokeColor="#faad14"
                  format={() => `${Math.round(difficultyStats.medium.average)}/100 avg`}
                />
              </div>
              <div>
                <Text>Hard Questions</Text>
                <Progress 
                  percent={Math.round(difficultyStats.hard.average)} 
                  strokeColor="#ff4d4f"
                  format={() => `${Math.round(difficultyStats.hard.average)}/100 avg`}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="🏆 Top Performers">
        <Table
          columns={topPerformersColumns}
          dataSource={topPerformers}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AnalyticsTab;
