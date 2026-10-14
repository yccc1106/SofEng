'use client';
import { useLanguage } from '@/lib/language';
import React from 'react';
import { Card, Typography, Statistic, Row, Col } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface Category {
    id: string;
    name: string;
    description: string | null;
    usageCount: number;
    children?: Category[];
}

interface InterestSelectorProps {
    categories: Category[];
}

const InterestSelector: React.FC<InterestSelectorProps> = ({ categories }) => {
    const { t } = useLanguage();
    const router = useRouter();

    const handleSelect = (id: string) => {
        router.push(`/interest/${id}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <Row gutter={[24, 24]}>
                {categories.map((category) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                        <Card
                            hoverable
                            className="h-full flex flex-col justify-between transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 bg-white/80 backdrop-blur-sm"
                            onClick={() => handleSelect(category.id)}
                            cover={
                                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center rounded-t-lg">
                                    <span className="text-4xl font-bold text-white opacity-90">
                                        {category.name.charAt(0)}
                                    </span>
                                </div>
                            }
                        >
                            <div className="flex flex-col h-full">
                                <div className="mb-4">
                                    <Title level={4} className="mb-2 !text-gray-800">{category.name}</Title>
                                    <Paragraph className="text-gray-500 line-clamp-2" ellipsis={{ rows: 2 }}>
                                        {category.description || t('Join this community to connect with others.')}
                                    </Paragraph>
                                </div>
                                <div className="mt-auto flex justify-between items-end">
                                    <Statistic
                                        value={category.usageCount}
                                        prefix={<UserOutlined />}
                                        styles={{ content: { fontSize: 16, color: '#6b7280' } }}
                                    />
                                    <ArrowRightOutlined className="text-indigo-600" />
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default InterestSelector;
