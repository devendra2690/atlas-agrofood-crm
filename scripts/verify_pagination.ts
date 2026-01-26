
import { getSalesOrders } from '../src/app/actions/order';
import { getAllSamples } from '../src/app/actions/sample';
import { getPurchaseOrders } from '../src/app/actions/procurement';

async function main() {
    console.log('--- Verifying Pagination ---');

    // 1. Verify Sales Orders Pagination
    console.log('\n1. Testing Sales Orders (Page 2, Limit 5)');
    try {
        const ordersResult = await getSalesOrders({ page: 2, limit: 5 });
        if (ordersResult.success && ordersResult.pagination) {
            console.log(`Success: Displaying page ${ordersResult.pagination.page} of ${ordersResult.pagination.totalPages}`);
            console.log(`Total Items: ${ordersResult.pagination.total}`);
            console.log(`Items returned: ${ordersResult.data?.length}`);

            if (ordersResult.pagination.page === 2 && ordersResult.data?.length === 5) {
                console.log('✅ Sales Orders Pagination Verified');
            } else {
                console.error('❌ Sales Orders Pagination Failed Mismatch');
            }
        } else {
            console.error('❌ Sales Orders Pagination Failed (No metadata)', ordersResult);
        }
    } catch (e) { console.error('Error testing sales orders', e); }


    // 2. Verify Samples Pagination
    console.log('\n2. Testing Samples (Page 2, Limit 5)');
    try {
        const samplesResult = await getAllSamples({ page: 2, limit: 5 });
        if (samplesResult.success && (samplesResult as any).pagination) {
            const pagination = (samplesResult as any).pagination;
            console.log(`Success: Displaying page ${pagination.page} of ${pagination.totalPages}`);
            console.log(`Total Items: ${pagination.total}`);
            console.log(`Items returned: ${samplesResult.data?.length}`);

            if (pagination.page === 2 && samplesResult.data?.length === 5) {
                console.log('✅ Samples Pagination Verified');
            } else {
                console.error('❌ Samples Pagination Failed Mismatch');
            }
        } else {
            console.error('❌ Samples Pagination Failed (No metadata)', samplesResult);
        }
    } catch (e) { console.error('Error testing samples', e); }

    // 3. Verify Purchase Orders Pagination
    console.log('\n3. Testing Purchase Orders (Page 2, Limit 5)');
    try {
        const poResult = await getPurchaseOrders({ page: 2, limit: 5 });
        if (poResult.success && poResult.pagination) {
            console.log(`Success: Displaying page ${poResult.pagination.page} of ${poResult.pagination.totalPages}`);
            console.log(`Total Items: ${poResult.pagination.total}`);
            console.log(`Items returned: ${poResult.data?.length}`);

            if (poResult.pagination.page === 2 && poResult.data?.length === 5) {
                console.log('✅ Purchase Orders Pagination Verified');
            } else {
                console.error('❌ Purchase Orders Pagination Failed Mismatch');
            }
        } else {
            console.error('❌ Purchase Orders Pagination Failed (No metadata)', poResult);
        }
    } catch (e) { console.error('Error testing POs', e); }

}

main().catch(console.error);
