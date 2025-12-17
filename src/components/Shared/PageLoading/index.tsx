import { Spin } from 'antd';

// loading components from code split
// https://umijs.org/plugin/umi-plugin-react.html#dynamicimport
export default () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <Spin size="large" />
  </div>
);
