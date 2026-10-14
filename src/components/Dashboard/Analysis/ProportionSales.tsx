import { Pie } from '@ant-design/plots';
import { Card, Segmented, Typography } from 'antd';
import numeral from 'numeral';
import React from 'react';
import type { DataItem } from '@/types/analysis';
import useStyles from './style.style';

const { Text } = Typography;
const ProportionSales = ({
  dropdownGroup,
  salesType,
  loading,
  salesPieData,
  handleChangeSalesType,
}: {
  loading: boolean;
  dropdownGroup: React.ReactNode;
  salesType: 'all' | 'online' | 'stores';
  salesPieData: DataItem[];
  handleChangeSalesType?: (value: 'all' | 'online' | 'stores') => void;
}) => {
  const { styles } = useStyles();
  return (
    <Card
      loading={loading}
      className={`${styles.salesCard} bg-white rounded-lg shadow-sm`}
      variant="borderless"
      title="用户画像分布"
      style={{
        height: '100%',
      }}
      extra={
        <div className={styles.salesCardExtra}>
          {dropdownGroup}
          <Segmented
            className={styles.salesTypeRadio}
            value={salesType}
            onChange={handleChangeSalesType}
            options={[
              { label: '性别分布', value: 'all' },
              { label: '年龄分布', value: 'online' },
              { label: '兴趣分布', value: 'stores' },
            ]}
            size="middle"
          />
        </div>
      }
    >
      <Text>用户占比</Text>
      <Pie
        height={340}
        radius={0.8}
        innerRadius={0.5}
        angleField="y"
        colorField="x"
        data={salesPieData}
        legend={false}
        label={{
          position: 'spider',
          text: (item: { x: number; y: number }) =>
            `${item.x}: ${numeral(item.y).format('0,0')}`,
        }}
      />
    </Card>
  );
};
export default ProportionSales;
