
import { getOpportunities } from "./src/app/actions/opportunity";
import { getProcurementProjects, getPurchaseOrders } from "./src/app/actions/procurement";
import { getSalesOrders } from "./src/app/actions/order";

async function verify() {
    console.log("--- Verifying Opportunities Pagination ---");
    const opps = await getOpportunities({ page: 1, limit: 1 });
    if (opps.success && opps.pagination) {
        console.log(`Success! Total: ${opps.pagination.total}, Page: ${opps.pagination.page}, Limit: ${opps.pagination.limit}`);
    } else {
        console.error("Failed Opportunities:", opps.error || "No pagination data");
    }

    console.log("\n--- Verifying Opportunity Filters ---");
    // Test Query
    const oppSearchResult = await getOpportunities({ query: 'Pagination Test Client', page: 1, limit: 5 });
    if (oppSearchResult.success && oppSearchResult.data) {
        console.log(`Search 'Pagination Test Client': Found ${oppSearchResult.pagination?.total} opportunities.`);
        // Note: Filter searches in Company Name OR Product Name.
        const matches = oppSearchResult.data.filter(o => o.company.name.includes('Pagination Test Client') || o.productName.includes('Pagination Test Client'));
        console.log(`Matched results: ${matches.length}/${oppSearchResult.data.length}`);
    } else {
        console.error("Failed Opportunity Search:", oppSearchResult.error);
    }

    // Test Status
    const oppStatusResult = await getOpportunities({ status: 'OPEN', page: 1, limit: 5 });
    if (oppStatusResult.success && oppStatusResult.data) {
        console.log(`Filter Status 'OPEN': Found ${oppStatusResult.pagination?.total} opportunities.`);
        const allOpen = oppStatusResult.data.every(o => o.status === 'OPEN');
        console.log(`All results are OPEN? ${allOpen}`);
    } else {
        console.error("Failed Opportunity Status Filter:", oppStatusResult.error);
    }

    console.log("\n--- Verifying Procurement Projects Pagination ---");
    const projects = await getProcurementProjects({ page: 1, limit: 1 });
    if (projects.success && projects.pagination) {
        console.log(`Success! Total: ${projects.pagination.total}, Page: ${projects.pagination.page}, Limit: ${projects.pagination.limit}`);
    } else {
        console.error("Failed Procurement:", projects.error || "No pagination data");
    }

    console.log("\n--- Verifying Purchase Orders Pagination ---");
    const orders = await getPurchaseOrders({ page: 1, limit: 1 });
    if (orders.success && orders.pagination) {
        console.log(`Success! Total: ${orders.pagination.total}, Page: ${orders.pagination.page}, Limit: ${orders.pagination.limit}`);
    } else {
        console.error("Failed Purchase Orders:", orders.error || "No pagination data");
    }

    console.log("\n--- Verifying Sales Orders Pagination ---");
    const salesOrders = await getSalesOrders({ page: 1, limit: 1 });
    if (salesOrders.success && salesOrders.pagination) {
        console.log(`Success! Total: ${salesOrders.pagination.total}, Page: ${salesOrders.pagination.page}, Limit: ${salesOrders.pagination.limit}`);
    } else {
        console.error("Failed Sales Orders:", salesOrders.error || "No pagination data");
    }

    console.log("\n--- Verifying Sales Order Filters ---");
    // Test Query
    const searchResult = await getSalesOrders({ query: 'Pagination Test Client', page: 1, limit: 5 });
    if (searchResult.success && searchResult.data) {
        console.log(`Search 'Pagination Test Client': Found ${searchResult.pagination?.total} orders.`);
        const allMatch = searchResult.data.every(o => o.client.name.includes('Pagination Test Client'));
        console.log(`All results match query? ${allMatch}`);
    } else {
        console.error("Failed Search:", searchResult.error);
    }

    // Test Status
    const statusResult = await getSalesOrders({ status: 'PENDING', page: 1, limit: 5 });
    if (statusResult.success && statusResult.data) {
        console.log(`Filter Status 'PENDING': Found ${statusResult.pagination?.total} orders.`);
        const allPending = statusResult.data.every(o => o.status === 'PENDING');
        console.log(`All results are PENDING? ${allPending}`);
    } else {
        console.error("Failed Status Filter:", statusResult.error);
    }
}

verify().catch(console.error);
