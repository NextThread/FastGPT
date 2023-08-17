import React, { useState, useCallback } from 'react';
import { ModalFooter, ModalBody, Button, Input, Box, Grid } from '@chakra-ui/react';
import { getPayCode, checkPayResult } from '@/api/user';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getErrText } from '@/utils/tools';
import { useTranslation } from 'react-i18next';
import Markdown from '@/components/Markdown';
import MyModal from '@/components/MyModal';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const PayModal = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [inputVal, setInputVal] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [payId, setPayId] = useState('');

  const handleClickPay = useCallback(async () => {
    if (!inputVal || inputVal <= 0 || isNaN(+inputVal)) return;
    setLoading(true);
    try {
      // 获取支付二维码
      const res = await getPayCode(inputVal);
      new window.QRCode(document.getElementById('payQRCode'), {
        text: res.codeUrl,
        width: 128,
        height: 128,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H
      });
      setPayId(res.payId);
    } catch (err) {
      toast({
        title: getErrText(err),
        status: 'error'
      });
    }
    setLoading(false);
  }, [inputVal, toast]);

  useQuery(
    [payId],
    () => {
      if (!payId) return null;
      return checkPayResult(payId);
    },
    {
      enabled: !!payId,
      refetchInterval: 3000,
      onSuccess(res) {
        if (!res) return;
        toast({
          title: t('充值成功'),
          status: 'success'
        });
        router.reload();
      }
    }
  );

  return (
    <MyModal
      isOpen={true}
      onClose={() => {
        if (payId) return;
        onClose();
      }}
      title={t('user.Pay')}
      showCloseBtn={!payId}
    >
      <ModalBody py={0}>
        {!payId && (
          <>
            <Grid gridTemplateColumns={'repeat(4,1fr)'} gridGap={5} mb={4}>
              {[10, 20, 50, 100].map((item) => (
                <Button
                  key={item}
                  variant={item === inputVal ? 'solid' : 'outline'}
                  onClick={() => setInputVal(item)}
                >
                  {item}元
                </Button>
              ))}
            </Grid>
            <Box mb={4}>
              <Input
                value={inputVal}
                type={'number'}
                step={1}
                placeholder={'其他金额，请取整数'}
                onChange={(e) => {
                  setInputVal(Math.floor(+e.target.value));
                }}
              ></Input>
            </Box>
            <Markdown
              source={t(`
| 计费项 | 价格: 元/ 1K tokens(包含上下文)|
| --- | --- |
| 知识库 - 索引 | 0.002 |
| FastAI4k - 对话 | 0.015 |
| FastAI16k - 对话 | 0.03 |
| FastAI-Plus - 对话 | 0.45 |
| 文件拆分 | 0.03 |`)}
            />
          </>
        )}
        {/* 付费二维码 */}
        <Box textAlign={'center'}>
          {payId && (
            <Box mb={3}>
              {t('请微信扫码支付')}: {inputVal}
              {t('元')},{t('请勿关闭页面')}
            </Box>
          )}
          <Box id={'payQRCode'} display={'inline-block'}></Box>
        </Box>
      </ModalBody>

      <ModalFooter>
        {!payId && (
          <>
            <Button variant={'base'} onClick={onClose}>
              {t('取消')}
            </Button>
            <Button
              ml={3}
              isLoading={loading}
              isDisabled={!inputVal || inputVal === 0}
              onClick={handleClickPay}
            >
              {t('获取充值二维码')}
            </Button>
          </>
        )}
      </ModalFooter>
    </MyModal>
  );
};

export default PayModal;
