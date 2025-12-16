'use client';

import { Button } from 'antd';
import { ProCard } from '@ant-design/pro-components';

export default function Home() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-12">
      <ProCard
        title="Next.js + Ant Design Pro"
        extra={<Button type="primary">主按钮</Button>}
        tooltip="这是基于 Next.js 15 和 Ant Design 6 构建的"
        style={{ maxWidth: 800 }}
        boxShadow
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            迁移成功！🚀
          </h1>
          <p className="text-gray-500 mb-8">
            现在的环境已经支持 TailwindCSS (`text-gray-500`) 和 Ant Design 组件混用。
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-medium">
              Tailwind Grid
            </div>
            <div className="h-24 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-medium">
              Ant Design System
            </div>
            <div className="h-24 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-medium">
              TypeScript
            </div>
          </div>
        </div>
      </ProCard>
    </div>
  );
}
