'use client';

import { Column, Line } from '@ant-design/plots';
import { Card, Col, Empty, Row, Spin, Statistic, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { loadDashboardStats, type Point } from '@/services/analysis';

function Chart({ data, kind }: { data: Point[]; kind: 'line' | 'column' }) {
  if (!data.length || data.every(point => point.y === 0)) return <Empty description="暂无数据" />;
  const compact = data.map(point => ({ ...point, x: kind === 'line' ? point.x.slice(5).replace('-', '/') : `${Number(point.x.slice(5))}月` }));
  if (kind === 'line') return <Line data={compact} xField="x" yField="y" height={280} />;
  return <Column data={compact} xField="x" yField="y" height={280} />;
}

function TypeDistribution({ data }: { data: Point[] }) {
  if (!data.length) return <Empty description="暂无数据" />;
  const max = Math.max(...data.map(point => point.y));
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
    {data.map(point => <div key={point.x}>
      <div className="mb-1 flex justify-between text-sm"><span>{point.x}</span><span className="font-medium">{point.y}</span></div>
      <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-500" style={{ width: `${Math.round(point.y / max * 100)}%` }} /></div>
    </div>)}
  </div>;
}

function Metric({ title, value, lines }: { title: string; value: number; lines: string[] }) {
  return <Card className="h-full" styles={{ body: { minHeight: 150 } }}>
    <Statistic title={title} value={value} />
    <div className="mt-2 flex flex-col gap-1 text-xs leading-5 text-gray-500">
      {lines.map(line => <span key={line}>{line}</span>)}
    </div>
  </Card>;
}

export default function Analysis() {
  const { data, loading, error } = useRequest(loadDashboardStats);
  if (loading) return <div className="flex justify-center p-16"><Spin size="large" /></div>;
  if (error || !data) return <Empty description="统计加载失败，请刷新后重试" />;
  return (
    <div className="space-y-5">
      <Typography.Paragraph type="secondary" className="mb-0 leading-6">
        按上海时间自然日统计。活跃用户指发帖、评论、点赞或发送消息的去重普通用户。增长率基期为 0 时显示 0%。
      </Typography.Paragraph>
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={12} xl={6}>
          <Metric title="有效用户" value={data.userCount} lines={[`今日新增 ${data.newUsers}`, `日增长 ${data.dailyGrowth}% · 近七日增长 ${data.weeklyGrowth}%`]} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Metric title="今日活跃用户" value={data.dailyActiveUsers} lines={[`近七日去重 ${data.weeklyActiveUsers}`, `占有效用户 ${data.interactionRate}%`]} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Metric title="帖子总数" value={data.postCount} lines={[`今日新增 ${data.newPosts}`, '不含已删除帖子']} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Metric title="待处理举报" value={data.pendingReports} lines={[`已处理 ${data.processedReports}`, `处理率 ${data.overallProcessingRate}%`]} />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}><Card title="近七日活跃用户"><Chart data={data.visitData} kind="line" /></Card></Col>
        <Col xs={24} xl={12}><Card title="近七日新增帖子"><Chart data={data.postweeklyGrowth} kind="line" /></Card></Col>
        <Col xs={24} xl={12}><Card title="近十二个月新增帖子"><Chart data={data.salesData} kind="column" /></Card></Col>
        <Col xs={24} xl={12}><Card title="性格类型分布"><TypeDistribution data={data.salesTypeData} /></Card></Col>
      </Row>
    </div>
  );
}
