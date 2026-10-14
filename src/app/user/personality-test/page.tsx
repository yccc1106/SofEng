'use client';
import { useLanguage } from '@/lib/language';
import React, { useState } from 'react';
import { Card, Button, Radio, Progress, App, Typography } from 'antd';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

const questions = [
    {
        id: 1,
        question: "When meeting new people, you usually...",
        options: [
            { label: "Initiate conversation (E)", value: "E" },
            { label: "Wait for them to talk to you (I)", value: "I" }
        ]
    },
    {
        id: 2,
        question: "You prefer to focus on...",
        options: [
            { label: "Current realities and facts (S)", value: "S" },
            { label: "Future possibilities and meanings (N)", value: "N" }
        ]
    },
    {
        id: 3,
        question: "When making decisions, you prioritize...",
        options: [
            { label: "Logic and consistency (T)", value: "T" },
            { label: "People and special circumstances (F)", value: "F" }
        ]
    },
    {
        id: 4,
        question: "You prefer your life to be...",
        options: [
            { label: "Planned and organized (J)", value: "J" },
            { label: "Spontaneous and flexible (P)", value: "P" }
        ]
    }
];

/** 收集四道问卷答案；性格类型和标签由 Java 后端计算。 */
const PersonalityTestPage = () => {
    const { t } = useLanguage();
    const { message } = App.useApp();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);

    const handleOptionSelect = (value: string) => {
        setAnswers({ ...answers, [questions[currentStep].id]: value });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/java/personality-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            if (data.success) {
                message.success(t('Test complete! Result: ') + data.data.type);
                router.push('/user/profile');
            } else {
                message.error(t('Failed to save results'));
            }
        } catch {
            message.error(t('Error submitting test'));
        } finally {
            setLoading(false);
        }
    };

    const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
    const currentQ = questions[currentStep];

    return (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
            <Card className="w-full shadow-md max-w-lg">
                <Title level={3} className="text-center mb-6">{t("Personality Test")}</Title>
                <Progress percent={progressPercent} showInfo={false} className="mb-6" />

                <div className="mb-8">
                    <Title level={5} className="mb-4 text-gray-700">{currentStep + 1}. {t(currentQ.question)}</Title>
                    <Radio.Group
                        onChange={e => handleOptionSelect(e.target.value)}
                        value={answers[currentQ.id]}
                        className="flex flex-col gap-3"
                    >
                        {currentQ.options.map(opt => (
                            <Radio key={opt.value} value={opt.value} className="text-base p-2 border rounded-md hover:bg-blue-50 transition-colors">
                                {t(opt.label)}
                            </Radio>
                        ))}
                    </Radio.Group>
                </div>

                <div className="flex justify-between">
                    <Button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        {t('Previous')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleNext}
                        disabled={!answers[currentQ.id]}
                        loading={loading}
                    >
                        {currentStep === questions.length - 1 ? t('Submit') : t('Next')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PersonalityTestPage;
