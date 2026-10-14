import { Spin } from 'antd';

export default function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Spin size="large" />
    </div>
  );
}
