import { InfoCircleOutlined } from '@ant-design/icons';
import { Area, Column } from '@ant-design/plots';
import { Col, Progress, Row, Tooltip } from 'antd';
import numeral from 'numeral';
import type { DataItem } from '@/types/analysis';
import useStyles from './style.style';
import Yuan from '@/components/Shared/Yuan';
import { ChartCard, Field } from '@/components/Charts';
import Trend from '@/components/Shared/Trend';

const topColResponsiveProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  style: {
    marginBottom: 24,
  },
};
const IntroduceRow = ({
  loading,
  visitData,
  userCount,
  dailyActiveUsers,
  weeklyActiveUsers,
  newPosts,
  pendingReports,
  processedReports,
  newUsers,
  interactionRate,
  weeklyGrowth,
  dailyGrowth,
  todayUsers,
  postweeklyGrowth,
  overallProcessingRate,

}: {
  loading: boolean;
  visitData: DataItem[];
  userCount?: number;
  dailyActiveUsers?: number;
  weeklyActiveUsers?: number;
  newPosts?: number;
  pendingReports?: number;
  processedReports?: number;
  newUsers?: number;
  interactionRate?: number;
  weeklyGrowth?: number;
  dailyGrowth?: number;
  todayUsers?: number;
  postweeklyGrowth?: DataItem[];
  overallProcessingRate: number;
}) => {
  const { styles } = useStyles();
  return (
    <Row gutter={24}>
      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          title="总用户数"
          action={
            <Tooltip title="平台注册用户总量">
              <InfoCircleOutlined />
            </Tooltip>
          }
          loading={loading}
          total={() => <span>{userCount}</span>}
          footer={
            <Field
              label="日新增用户"
              value={numeral(todayUsers).format('0,0')}
            />
          }
          contentHeight={46}
        >
          <Trend
            flag="up"
            style={{
              marginRight: 16,
            }}
          >
            周同比
            <span className={styles.trendText}>{weeklyGrowth}%</span>
          </Trend>
          <Trend flag="up">
            日同比
            <span className={styles.trendText}>{dailyGrowth}%</span>
          </Trend>
        </ChartCard>
      </Col>

      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          loading={loading}
          title="日活跃用户"
          action={
            <Tooltip title="每日登录用户数">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={numeral(dailyActiveUsers).format('0,0')}
          footer={
            <Field label="周均活跃" value={numeral(weeklyActiveUsers).format('0,0')} />
          }
          contentHeight={46}
        >
          <Area
            xField="x"
            yField="y"
            shapeField="smooth"
            height={46}
            axis={false}
            style={{
              fill: 'linear-gradient(-90deg, white 0%, #975FE4 100%)',
              fillOpacity: 0.6,
              width: '100%',
            }}
            padding={-20}
            data={visitData}
          />
        </ChartCard>
      </Col>
      <Col {...topColResponsiveProps}>
        <ChartCard
          variant="borderless"
          loading={loading}
          title="新增帖子"
          action={
            <Tooltip title="每日新增帖子数量">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={numeral(newPosts).format('0,0')}
          footer={<Field label="用户互动率" value={`${interactionRate}%`} />}
          contentHeight={46}
        >
          <Column
            xField="x"
            yField="y"
            padding={-20}
            axis={false}
            height={46}
            data={postweeklyGrowth}
            scale={{ x: { paddingInner: 0.4 } }}
          />
        </ChartCard>
      </Col>
      <Col {...topColResponsiveProps}>
        <ChartCard
          loading={loading}
          bordered={false}
          title="待处理举报"
          action={
            <Tooltip title="需要人工介入处理的举报">
              <InfoCircleOutlined />
            </Tooltip>
          }
          total={pendingReports}
          footer={
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <Field label="今日已处理" value={processedReports} />
            </div>
          }
          contentHeight={46}
        >
          <Progress
            percent={overallProcessingRate}
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
            status="active"
          />
        </ChartCard>
      </Col>
    </Row>
  );
};
export default IntroduceRow;
