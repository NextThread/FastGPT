import React, { useState, useCallback } from 'react';
import {
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Box
} from '@chakra-ui/react';
import { getPayOrders, checkPayResult } from '@/api/user';
import { PaySchema } from '@/types/mongoSchema';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@/utils/user';
import { useGlobalStore } from '@/store/global';
import { useToast } from '@/hooks/useToast';
import { useLoading } from '@/hooks/useLoading';
import MyIcon from '@/components/Icon';
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
const PayRecordTable = () => {
  const { Loading, setIsLoading } = useLoading();
  const [payOrders, setPayOrders] = useState<PaySchema[]>([]);
  const { toast } = useToast();

  const handleRefreshPayOrder = useCallback(
    async (payId: string) => {
      setIsLoading(true);

      try {
        const data = await checkPayResult(payId);
        toast({
          title: data,
          status: 'success'
        });
        const res = await getPayOrders();
        setPayOrders(res);
      } catch (error: any) {
        toast({
          title: error?.message,
          status: 'warning'
        });
        console.log(error);
      }

      setIsLoading(false);
    },
    [setIsLoading, toast]
  );

  const { isInitialLoading } = useQuery(['initPayOrder'], getPayOrders, {
    onSuccess(res) {
      setPayOrders(res);
    }
  });

  return (
    <Box position={'relative'} h={'100%'}>
      {!isInitialLoading && payOrders.length === 0 ? (
        <Flex h={'100%'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
          <MyIcon name="empty" w={'48px'} h={'48px'} color={'transparent'} />
          <Box mt={2} color={'myGray.500'}>
            {t('无支付记录~')}
          </Box>
        </Flex>
      ) : (
        <TableContainer py={[0, 5]} px={[3, 8]} h={'100%'} overflow={'overlay'}>
          <Table>
            <Thead>
              <Tr>
                <Th>{t('订单号')}</Th>
                <Th>{t('时间')}</Th>
                <Th>{t('金额')}</Th>
                <Th>{t('状态')}</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody fontSize={'sm'}>
              {payOrders.map((item) => (
                <Tr key={item._id}>
                  <Td>{item.orderId}</Td>
                  <Td>
                    {item.createTime ? dayjs(item.createTime).format('YYYY/MM/DD HH:mm:ss') : '-'}
                  </Td>
                  <Td>{formatPrice(item.price)}元</Td>
                  <Td>{item.status}</Td>
                  <Td>
                    {item.status === 'NOTPAY' && (
                      <Button onClick={() => handleRefreshPayOrder(item._id)} size={'sm'}>
                        {t('更新')}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      <Loading loading={isInitialLoading} fixed={false} />
    </Box>
  );
};

export default PayRecordTable;
