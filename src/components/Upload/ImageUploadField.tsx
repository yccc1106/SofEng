'use client';

import { App, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useState } from 'react';
import { useLanguage } from '@/lib/language';
import { uploadImage, validateImageFile, type ImageUploadScope } from '@/lib/image-upload';

interface ImageUploadFieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  scope: ImageUploadScope;
  max?: number;
  buttonText?: string;
}

function asFileList(urls: string[]): UploadFile[] {
  return urls.map((url) => ({
    uid: url,
    name: url.split('/').pop() || 'image',
    status: 'done',
    url,
    thumbUrl: url,
  }));
}

/** Form-compatible image picker that uploads to a dedicated backend scope. */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value = [],
  onChange,
  onUploadingChange,
  scope,
  max = 1,
  buttonText = 'Upload image',
}) => {
  const { t } = useLanguage();
  const { message } = App.useApp();
  const [activeUploads, setActiveUploads] = useState<UploadFile[]>([]);
  const fileList = [...asFileList(value), ...activeUploads].slice(0, max);

  const updateUrls: UploadProps['onChange'] = ({ fileList: nextFiles }) => {
    setActiveUploads(nextFiles.filter((file) => file.status === 'uploading'));
    onUploadingChange?.(nextFiles.some((file) => file.status === 'uploading'));
    const urls = Array.from(new Set(nextFiles.flatMap((file) => {
      if (file.status !== 'done') return [];
      const uploaded = (file.response as { url?: string } | undefined)?.url;
      return uploaded ? [uploaded] : file.url?.startsWith('/java/uploads/') ? [file.url] : [];
    })));
    onChange?.(urls);
  };

  const customRequest: UploadProps['customRequest'] = async ({ file, onError, onSuccess }) => {
    try {
      const url = await uploadImage(file as File, scope);
      onSuccess?.({ url });
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error(t('Image upload failed'));
      message.error(t(uploadError.message));
      onError?.(uploadError);
    }
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const error = validateImageFile(file);
    if (error) {
      message.error(t(error));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  return (
    <Upload
      accept="image/jpeg,image/png,image/webp,image/gif"
      listType="picture-card"
      fileList={fileList}
      beforeUpload={beforeUpload}
      customRequest={customRequest}
      onChange={updateUrls}
      maxCount={max}
    >
      {fileList.length < max && (
        <button type="button" style={{ border: 0, background: 'none', cursor: 'pointer' }}>
          <div style={{ fontSize: 24 }}>+</div>
          <div>{t(buttonText)}</div>
        </button>
      )}
    </Upload>
  );
};

export default ImageUploadField;
