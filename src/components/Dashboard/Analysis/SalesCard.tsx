import { Column } from '@ant-design/plots';
import { Button, Card, Col, DatePicker, Row, Tabs } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import numeral from 'numeral';
import type { DataItem } from '@/types/analysis';
import useStyles from './style.style';

export type TimeType = 'today' | 'week' | 'month' | 'year';
const { RangePicker } = DatePicker;

const SalesCard = ({
  rangePickerValue,
  salesData,
  isActive,
  handleRangePickerChange,
  loading,
  selectDate,
  categoryData,  // 新增分类数据属性
}: {
  rangePickerValue: RangePickerProps['value'];
  isActive: (key: TimeType) => string;
  salesData: DataItem[];
  loading: boolean;
  handleRangePickerChange: RangePickerProps['onChange'];
  selectDate: (key: TimeType) => void;
  categoryData: { name: string; usageCount: number }[];  // 新增
}) => {
  const { styles } = useStyles();
  return (
    <Card
      loading={loading}
      variant="borderless"
      className="bg-white rounded-lg shadow-sm"
      styles={{
        body: {
          padding: loading ? 24 : 0,
        },
      }}
    >
      <Tabs
        className={styles.salesCard}
        tabBarExtraContent={
          <div className={styles.salesExtraWrap}>
            <div className={styles.salesExtra}>
              <Button
                type="text"
                className={isActive('today')}
                onClick={() => selectDate('today')}
              >
                今日
              </Button>
              <Button
                type="text"
                className={isActive('week')}
                onClick={() => selectDate('week')}
              >
                本周
              </Button>
              <Button
                type="text"
                className={isActive('month')}
                onClick={() => selectDate('month')}
              >
                本月
              </Button>
              <Button
                type="text"
                className={isActive('year')}
                onClick={() => selectDate('year')}
              >
                本年
              </Button>
            </div>
            <RangePicker
              value={rangePickerValue}
              onChange={handleRangePickerChange}
              variant="filled"
              style={{
                width: 256,
              }}
            />
          </div>
        }
        size="large"
        tabBarStyle={{
          marginBottom: 24,
        }}
        items={[
          {
            key: 'sales',
            label: '用户活跃',
            children: (
              <Row>
                <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesBar}>
                    <Column
                      height={300}
                      data={salesData}
                      xField="x"
                      yField="y"
                      paddingBottom={12}
                      axis={{
                        x: {
                          title: false,
                        },
                        y: {
                          title: false,
                          gridLineDash: null,
                          gridStroke: '#ccc',
                        },
                      }}
                      scale={{
                        x: { paddingInner: 0.4 },
                      }}
                      tooltip={{
                        name: '活跃用户',
                        channel: 'y',
                      }}
                    />
                  </div>
                </Col>
                <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesRank}>
                    <h4 className={styles.rankingTitle}>热门兴趣小组排名</h4>
                    <ul className={styles.rankingList}>
                        {categoryData?.slice(0, 7).map((item, i) => (
                            <li key={item.name}>
                              <span
                                  className={`${styles.rankingItemNumber} ${i < 3 ? styles.rankingItemNumberActive : ''}`}
                              >
                                {i + 1}
                              </span>
                                <span
                                    className={styles.rankingItemTitle}
                                    title={item.name}
                                >
                                {item.name}
                              </span>
                                <span>{numeral(item.usageCount).format('0,0')}</span>
                            </li>
                        ))}
                    </ul>
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: 'views',
            label: '帖子热度',
            children: (
              <Row>
                <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesBar}>
                    <Column
                      height={300}
                      data={salesData}
                      xField="x"
                      yField="y"
                      paddingBottom={12}
                      axis={{
                        x: {
                          title: false,
                        },
                        y: {
                          title: false,
                        },
                      }}
                      scale={{
                        x: { paddingInner: 0.4 },
                      }}
                      tooltip={{
                        name: '帖子数',
                        channel: 'y',
                      }}
                    />
                  </div>
                </Col>
                <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesRank}>
                    <h4 className={styles.rankingTitle}>热门话题排名</h4>
                      <ul className={styles.rankingList}>
                          {categoryData?.slice(0, 7).map((item, i) => (
                              <li key={item.name}>
                                  <span
                                      className={`${i < 3
                                          ? styles.rankingItemNumberActive
                                          : styles.rankingItemNumber
                                      }`}
                                  >
                                    {i + 1}
                                  </span>
                                  <span
                                      className={styles.rankingItemTitle}
                                      title={item.name}
                                  >
                                    {item.name}
                                  </span>
                                  <span>{numeral(item.usageCount).format('0,0')}</span>
                              </li>
                          ))}
                      </ul>
                  </div>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Card>
  );
};
export default SalesCard;
