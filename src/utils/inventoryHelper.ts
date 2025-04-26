import prisma from "@/generic/prisma";

export const determineStockLevel = (quantity: number): string => {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= 30) return "Low Stock";
  if (quantity <= 98) return "Mid Stock";
  return "High Stock";
};

export const initializeSizeQuantities = (size: string) => {
  return {
    pending: 0,
    available: 0,
    withdrawn: 0,
    total: 0,
    returned: 0,
  };
};

export const createQuantitySummary = () => {
  return {
    totalQuantity: 0,
    availableQuantity: 0,
    pendingQuantity: 0,
    pendingIssuanceQuantity: 0,
    withdrawnQuantity: 0,
    returnedQuantity: 0,
    grandTotalAmount: 0,
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-EN", {
    maximumFractionDigits: 2,
  }).format(amount);
};

export const processOriginalInventoryItem = (inventory: any, sizeQuantities: any, quantitySummary: any) => {
  if (!inventory.item) return;
  
  const quantity = parseInt(inventory.item.quantity || "0", 10);
  const size = inventory.item.size || "No Size";
  const price = parseFloat(inventory.item.price || "0");
  const amount = quantity * price;

  if (!sizeQuantities[size]) {
    sizeQuantities[size] = initializeSizeQuantities(size);
  }

  sizeQuantities[size].available += quantity;
  quantitySummary.grandTotalAmount += amount;
};

export const processItems = (items: any[], sizeQuantities: any, quantitySummary: any) => {
  items.forEach((item) => {
    const quantity = parseInt(item.quantity || "0", 10);
    const size = item.size || "No Size";
    const price = parseFloat(item.price || "0");
    const amount = quantity * price;

    if (!sizeQuantities[size]) {
      sizeQuantities[size] = initializeSizeQuantities(size);
    }

    sizeQuantities[size].available += quantity;

    if (item.receiptId) {
      quantitySummary.grandTotalAmount += amount;
    }
  });
};

export const processReturnedTransactions = (transactions: any[], sizeQuantities: any, quantitySummary: any) => {
  transactions.forEach((transaction) => {
    if (transaction.type === "RETURNED") {
      const quantity = parseInt(transaction.quantity || "0", 10);
      const price = parseFloat(transaction.price || "0");
      const size = transaction.size || "No Size";

      if (!sizeQuantities[size]) {
        sizeQuantities[size] = initializeSizeQuantities(size);
      }

      sizeQuantities[size].returned += quantity;
      sizeQuantities[size].available += quantity;
      quantitySummary.returnedQuantity += quantity;
      quantitySummary.grandTotalAmount += quantity * price;
    }
  });
};

export const processReturnedItems = async (returnedItems: any[], sizeQuantities: any, quantitySummary: any) => {
  const enhancedReturnedItems = await Promise.all(
    returnedItems.map(async (item) => {
      const size = item.size || "No Size";

      if (!sizeQuantities[size]) {
        sizeQuantities[size] = initializeSizeQuantities(size);
      }

      const quantity = 1;
      sizeQuantities[size].returned += quantity;
      sizeQuantities[size].available += quantity;
      quantitySummary.returnedQuantity += quantity;

      const originalItem = await prisma.item.findFirst({
        where: { receiptRef: item.receiptRef },
        select: {
          price: true,
          amount: true,
        },
      });

      const price = originalItem ? parseFloat(originalItem.price || "0") : 0;
      quantitySummary.grandTotalAmount += quantity * price;

      return {
        ...item,
        price: originalItem?.price || "0",
        amount: originalItem?.amount || "0",
      };
    })
  );

  return enhancedReturnedItems;
};

export const processIssuanceDetails = (issuanceDetails: any[], sizeQuantities: any, quantitySummary: any) => {
  issuanceDetails.forEach((detail) => {
    if(detail.status === "archived"){
      return;
    }
    const quantity = parseInt(detail.quantity || "0", 10);
    const size = detail?.size || "No Size";
    const price = parseFloat(detail.price || "0");
    const amount = quantity * price;

    if (!sizeQuantities[size]) {
      sizeQuantities[size] = initializeSizeQuantities(size);
    }

    if (detail.status === "pending") {
      sizeQuantities[size].pending += quantity;
      quantitySummary.pendingIssuanceQuantity += quantity;
      quantitySummary.pendingQuantity += quantity;
    } else if (detail.status === "withdrawn") {
      sizeQuantities[size].withdrawn += quantity;
      quantitySummary.withdrawnQuantity += quantity;
      quantitySummary.grandTotalAmount -= amount;
    }
  });
};

export const processInventoryItems = (items: any[], sizeQuantities: any) => {
  items.forEach((item) => {
    if (item.issuanceDetailId) return;

    const quantity = parseInt(item.quantity || "", 10);
    const size = item.size || "No Size";

    if (!sizeQuantities[size]) {
      sizeQuantities[size] = initializeSizeQuantities(size);
    }

    sizeQuantities[size].total += quantity;
  });
};

export const processWithdrawnIssuance = (
  issuanceDetails: any, 
  items: any[], 
  sizeQuantities: any, 
  inventory: any
) => {
  if (!issuanceDetails || issuanceDetails.status !== "withdrawn") return;
  
  const quantity = parseInt(issuanceDetails.quantity || "0", 10);
  const itemForSize = items.find((item) => item.receipt?.status === "active") || inventory.item;
  const size = itemForSize?.size || "No Size";

  if (!sizeQuantities[size]) {
    sizeQuantities[size] = initializeSizeQuantities(size);
  }

  sizeQuantities[size].withdrawn += quantity;
};

export const calculateAvailableQuantities = (sizeQuantities: any) => {
  let totalAvailable = 0;

  Object.keys(sizeQuantities).forEach((size) => {
    const finalAvailable = Math.max(
      0,
      sizeQuantities[size].total -
        sizeQuantities[size].withdrawn +
        sizeQuantities[size].returned
    );
    sizeQuantities[size].available = finalAvailable;
    totalAvailable += finalAvailable;
  });

  return totalAvailable;
};

export const generateSizeDetailsGroups = (sizeQuantities: any) => {
  const available = Object.entries(sizeQuantities).map(([size, quantities]: [string, any]) => {
    const pairs = quantities.total - quantities.pending - quantities.withdrawn + quantities.returned;
    const availablePairs = Math.max(0, pairs);
    const stockLevel = determineStockLevel(availablePairs);
    return { size, pairs: String(availablePairs), status: stockLevel };
  });

  const total = Object.entries(sizeQuantities).map(([size, quantities]: [string, any]) => {
    const totalPairs = quantities.total - quantities.withdrawn + quantities.returned;
    const stockLevel = determineStockLevel(totalPairs);
    return { size, pairs: String(totalPairs), status: stockLevel };
  });

  const pending = Object.entries(sizeQuantities)
    .filter(([_, quantities]: [string, any]) => quantities.pending > 0)
    .map(([size, quantities]: [string, any]) => {
      const stockLevel = determineStockLevel(quantities.pending);
      return { size, pairs: String(quantities.pending), status: stockLevel };
    });

  const returned = Object.entries(sizeQuantities)
    .filter(([_, quantities]: [string, any]) => quantities.returned > 0)
    .map(([size, quantities]: [string, any]) => {
      const stockLevel = determineStockLevel(quantities.returned);
      return { size, pairs: String(quantities.returned), status: stockLevel };
    });

  return { available, total, pending, returned };
};

export const processInventoryItems2 = async (items: any[], inventoryId: string) => {
  return Promise.all(
    items.map(async (item) => {
      const [receiptItems, issuedItems, returnedItems] = await Promise.all([
        prisma.inventoryTransaction.findMany({
          where: { itemId: item.id, inventoryId, type: "RECEIPT" }
        }),
        prisma.inventoryTransaction.findMany({
          where: { 
            itemId: item.id, 
            inventoryId, 
            type: "ISSUANCE", 
            issuanceId: { not: null } 
          }
        }),
        prisma.inventoryTransaction.findMany({
          where: { itemId: item.id, inventoryId, type: "RETURNED" }
        })
      ]);

      const totalReturnedItems = returnedItems.reduce(
        (acc, item) => acc + parseInt(item.quantity || "0", 10), 0
      );

      // Process issuance details
      const issuanceDetails = [];
      for (const issuedItem of issuedItems) {
        const issuanceDetail = await prisma.issuanceDetail.findUnique({
          where: {
            id: issuedItem.issuanceId || "",
            status: { not: "pending" }
          }
        });

        if (issuanceDetail) {
          issuanceDetails.push({ ...issuedItem, ...issuanceDetail });
        }
      }

      // Calculate totals
      const totalReceiptItems = receiptItems.reduce(
        (acc, item) => acc + parseInt(item.quantity || "0", 10), 0
      );

      const totalIssuedItems = issuanceDetails.reduce(
        (acc, item) => acc + parseInt(item.quantity || "0", 10), 0
      );

      const adjustedIssuedItems = Math.max(0, totalIssuedItems - totalReturnedItems);

      const totalIssuedItemsAmount = issuanceDetails.reduce(
        (acc, item) => acc + parseFloat(item.amount || "0"), 0
      );

      const returnedItemsAmount = returnedItems.reduce(
        (acc, item) => acc + parseFloat(item.amount || "0"), 0
      );

      return {
        ...item,
        totalReceiptItems,
        totalIssuedItems: adjustedIssuedItems,
        totalReturnedItems,
        quantity: `${adjustedIssuedItems} / ${totalReceiptItems}`,
        is_consumed: adjustedIssuedItems >= totalReceiptItems,
        amount: Number(item.amount) - totalIssuedItemsAmount + returnedItemsAmount
      };
    })
  );
};