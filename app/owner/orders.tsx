import OrdersScreen from '../manager/orders';

export default function OwnerOrdersScreen() {
    return <OrdersScreen createOrderPath="/owner/create-order" />;
}
