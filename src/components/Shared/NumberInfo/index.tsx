import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import useStyles from './index.style';
export type NumberInfoProps = {
  title?: React.ReactNode | string;
  subTitle?: React.ReactNode | string;
  total?: React.ReactNode | string;
  status?: 'up' | 'down';
  theme?: string;
  gap?: number;
  subTotal?: number;
  suffix?: string;
  style?: React.CSSProperties;
};
const NumberInfo: React.FC<NumberInfoProps> = ({
  theme,
  title,
  subTitle,
  total,
  subTotal,
  status,
  suffix,
  gap,
  ...rest
}) => {
  const { styles } = useStyles();
  return (
    <div
      className={classNames({
        [styles[`numberInfo${theme}` as keyof typeof styles]]: !!theme,
      }, "font-sans")} // Enforce Geist font
      {...rest}
    >
      {title && (
        <div
          className={classNames(styles.numberInfoTitle, "text-gray-500 text-sm mb-2")}
          title={typeof title === 'string' ? title : ''}
        >
          {title}
        </div>
      )}
      {subTitle && (
        <div
          className={classNames(styles.numberInfoSubTitle, "text-gray-400 text-xs mb-2")}
          title={typeof subTitle === 'string' ? subTitle : ''}
        >
          {subTitle}
        </div>
      )}
      <div
        className={classNames(styles.numberInfoValue, "text-3xl font-semibold text-gray-900")}
        style={
          gap
            ? {
              marginTop: gap,
            }
            : {}
        }
      >
        <span>
          {total}
          {suffix && <em className={classNames(styles.suffix, "text-gray-500 text-base font-normal ml-1 not-italic")}>{suffix}</em>}
        </span>
        {(status || subTotal) && (
          <span className={classNames(styles.subTotal, "text-gray-500 text-base ml-2")}>
            {subTotal}
            {status && status === 'up' ? (
              <CaretUpOutlined className="text-red-500 ml-1" />
            ) : (
              <CaretDownOutlined className="text-green-500 ml-1" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
export default NumberInfo;
