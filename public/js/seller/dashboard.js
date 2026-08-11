/* =========================================================
   PLANTORA SELLER DASHBOARD
   Dashboard Analytics / Charts / Tables
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  const API = {
    statistics: "/seller/dashboard/statistics",
    revenue: "/seller/dashboard/revenue-chart",
    orders: "/seller/dashboard/orders-chart",
    inventory: "/seller/dashboard/inventory-chart",
    products: "/seller/dashboard/top-products",
    categories: "/seller/dashboard/top-categories",
    brands: "/seller/dashboard/top-brands",
    recentOrders: "/seller/dashboard/recent-orders",
  };

  const charts = {};

  let currentRevenuePeriod = "daily";

  let currentDateRange = "all";

  /* =========================================================
     CHART DEFAULTS
  ========================================================= */

  const FONT = {
    family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const COLORS = {
    green: "#1f7a32",
    greenDark: "#155b25",
    greenLight: "#75b882",

    blue: "#4777d9",
    purple: "#8064c7",
    orange: "#d99a2b",
    red: "#d84b5b",
    teal: "#319b87",

    grey: "#8b948e",

    grid: "rgba(28, 48, 34, 0.07)",
    text: "#5f6b63",
  };

  /* =========================================================
     CHART.JS CHECK
  ========================================================= */

  if (typeof Chart === "undefined") {
    console.error(
      "Chart.js is not loaded. Make sure Chart.js is included before seller/dashboard.js.",
    );

    return;
  }

  Chart.defaults.font.family = FONT.family;

  Chart.defaults.font.size = 11;

  Chart.defaults.color = COLORS.text;

  Chart.defaults.borderColor = COLORS.grid;

  Chart.defaults.animation.duration = 650;

  Chart.defaults.animation.easing = "easeOutQuart";

  /* =========================================================
     DOM HELPERS
  ========================================================= */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const getElement = (id) => document.getElementById(id);

  /* =========================================================
     FORMATTERS
  ========================================================= */

  function formatCurrency(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(number);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(Number(value || 0));
  }

  function formatPercent(value) {
    const number = Number(value || 0);

    return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
  }

  function shortCurrency(value) {
    const number = Number(value || 0);

    if (number >= 10000000) {
      return `₹${(number / 10000000).toFixed(1)}Cr`;
    }

    if (number >= 100000) {
      return `₹${(number / 100000).toFixed(1)}L`;
    }

    if (number >= 1000) {
      return `₹${(number / 1000).toFixed(1)}K`;
    }

    return `₹${number.toFixed(0)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     API
  ========================================================= */

  async function fetchJSON(url) {
    const response = await fetch(url, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      credentials: "same-origin",
    });

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Invalid server response.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Dashboard request failed.");
    }

    return data;
  }

  /* =========================================================
     DESTROY CHART
  ========================================================= */

  function destroyChart(name) {
    if (charts[name]) {
      charts[name].destroy();

      charts[name] = null;
    }
  }

  /* =========================================================
     COMMON CHART OPTIONS
  ========================================================= */

  function commonOptions() {
    return {
      responsive: true,

      maintainAspectRatio: false,

      interaction: {
        mode: "index",

        intersect: false,
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#17201a",

          titleColor: "#ffffff",

          bodyColor: "#ffffff",

          padding: 12,

          cornerRadius: 9,

          displayColors: true,

          titleFont: {
            size: 11,

            weight: "700",
          },

          bodyFont: {
            size: 11,
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          border: {
            display: false,
          },

          ticks: {
            color: "#8a948d",

            maxRotation: 0,

            autoSkip: true,

            maxTicksLimit: 12,
          },
        },

        y: {
          beginAtZero: true,

          grid: {
            color: COLORS.grid,
          },

          border: {
            display: false,
          },

          ticks: {
            color: "#8a948d",

            padding: 8,
          },
        },
      },
    };
  }

  /* =========================================================
     GRADIENT
  ========================================================= */

  function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);

    gradient.addColorStop(0, color1);

    gradient.addColorStop(1, color2);

    return gradient;
  }

  /* =========================================================
     UPDATE GROWTH BADGE
  ========================================================= */

  function updateGrowth(elementId, value) {
    const element = getElement(elementId);

    if (!element) return;

    const number = Number(value || 0);

    element.classList.remove("positive", "negative", "neutral");

    if (number > 0) {
      element.classList.add("positive");

      element.innerHTML = `
        <i class="bi bi-arrow-up"></i>
        ${Math.abs(number).toFixed(2)}%
      `;

      return;
    }

    if (number < 0) {
      element.classList.add("negative");

      element.innerHTML = `
        <i class="bi bi-arrow-down"></i>
        ${Math.abs(number).toFixed(2)}%
      `;

      return;
    }

    element.classList.add("neutral");

    element.innerHTML = `
      <i class="bi bi-dash"></i>
      0%
    `;
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  async function loadStatistics() {
    try {
      const data = await fetchJSON(API.statistics);

      const stats = data.statistics || {};

      /* =====================================================
         REVENUE
      ===================================================== */

      const totalRevenue = getElement("totalRevenue");

      if (totalRevenue) {
        totalRevenue.textContent = formatCurrency(stats.revenue?.total || 0);
      }

      updateGrowth("revenueGrowth", stats.revenue?.growth || 0);

      /* =====================================================
         ORDERS
      ===================================================== */

      const totalOrders = getElement("totalOrders");

      if (totalOrders) {
        totalOrders.textContent = formatNumber(stats.orders?.total || 0);
      }

      updateGrowth("ordersGrowth", stats.orders?.growth || 0);

      /* =====================================================
         PRODUCTS SOLD
      ===================================================== */

      const productsSold = getElement("productsSold");

      if (productsSold) {
        productsSold.textContent = formatNumber(stats.sales?.itemsSold || 0);
      }

      /* =====================================================
         AVERAGE ORDER VALUE
      ===================================================== */

      const averageOrderValue = getElement("averageOrderValue");

      if (averageOrderValue) {
        averageOrderValue.textContent = formatCurrency(
          stats.sales?.averageOrderValue || 0,
        );
      }

      /* =====================================================
         SUCCESSFUL ORDERS
         Optional element
      ===================================================== */

      const successfulOrders = getElement("successfulOrders");

      if (successfulOrders) {
        successfulOrders.textContent = `${Number(
          stats.orders?.deliveryRate || 0,
        ).toFixed(1)}%`;
      }

      /* =====================================================
         PRODUCTS / INVENTORY
      ===================================================== */

      const totalProducts = Number(stats.products?.total || 0);

      const lowStock = Number(stats.products?.lowStock || 0);

      const outOfStock = Number(stats.products?.outOfStock || 0);

      const healthyStock = Math.max(0, totalProducts - lowStock - outOfStock);

      /* =====================================================
         TOTAL PRODUCTS
      ===================================================== */

      const totalProductsElement = getElement("totalProducts");

      if (totalProductsElement) {
        totalProductsElement.textContent = formatNumber(totalProducts);
      }

      /* =====================================================
         ACTIVE PRODUCTS
      ===================================================== */

      const activeProductsElement = getElement("activeProducts");

      if (activeProductsElement) {
        activeProductsElement.textContent = formatNumber(
          stats.products?.active || 0,
        );
      }

      /* =====================================================
         INVENTORY - HEALTHY STOCK
      ===================================================== */

      const inventoryInStockElement = getElement("inventoryInStock");

      if (inventoryInStockElement) {
        inventoryInStockElement.textContent = formatNumber(healthyStock);
      }

      /* =====================================================
         INVENTORY - LOW STOCK
      ===================================================== */

      const inventoryLowStockElement = getElement("inventoryLowStock");

      if (inventoryLowStockElement) {
        inventoryLowStockElement.textContent = formatNumber(lowStock);
      }

      /* =====================================================
         INVENTORY - OUT OF STOCK
      ===================================================== */

      const inventoryOutOfStockElement = getElement("inventoryOutOfStock");

      if (inventoryOutOfStockElement) {
        inventoryOutOfStockElement.textContent = formatNumber(outOfStock);
      }

      /* =====================================================
         INVENTORY - TOTAL
      ===================================================== */

      const inventoryTotalElement = getElement("inventoryTotal");

      if (inventoryTotalElement) {
        inventoryTotalElement.textContent = formatNumber(totalProducts);
      }

      /* =====================================================
         CURRENT YEAR
      ===================================================== */

      const currentYearRevenue = getElement("currentYearRevenue");

      if (currentYearRevenue) {
        currentYearRevenue.textContent = formatCurrency(
          stats.revenue?.thisYear || 0,
        );
      }

      const realYear = getElement("realRevenueYear");

      if (realYear) {
        realYear.textContent = new Date().getFullYear();
      }

      /* =====================================================
         CHART REVENUE SUMMARY
      ===================================================== */

      updateChartRevenueSummary(
        stats.revenue?.thisYear || 0,
        stats.revenue?.yearlyGrowth || 0,
        stats.orders?.total || 0,
      );
    } catch (error) {
      console.error("Seller dashboard statistics failed:", error);
    }
  }

  /* =========================================================
     REVENUE SUMMARY
  ========================================================= */

  function updateChartRevenueSummary(revenue, growth, orders = 0) {
    const revenueElement = getElement("chartRevenue");

    const growthElement = getElement("chartRevenueGrowth");

    const ordersElement = getElement("chartOrders");

    if (revenueElement) {
      revenueElement.textContent = formatCurrency(revenue);
    }

    if (growthElement) {
      growthElement.textContent = formatPercent(growth);
    }

    if (ordersElement) {
      ordersElement.textContent = formatNumber(orders);
    }
  }

  /* =========================================================
     REVENUE CHART
  ========================================================= */

  async function loadRevenueChart(period = currentRevenuePeriod) {
    try {
      currentRevenuePeriod = period;

      let url = API.revenue;

      const now = new Date();

      const year = now.getFullYear();

      const month = now.getMonth() + 1;

      /*
       * Daily:
       * Current month broken down by day.
       */

      if (period === "daily") {
        url += `?year=${year}&month=${month}`;
      }

      /*
       * Monthly:
       * Current year data.
       */

      if (period === "monthly") {
        url += `?year=${year}`;
      }

      /*
       * Yearly:
       * Yearly revenue data.
       */

      if (period === "yearly") {
        url += `?year=${year}`;
      }

      const data = await fetchJSON(url);

      if (period === "daily") {
        renderDailyRevenueChart(data.revenue || []);

        return;
      }

      if (period === "monthly" || period === "yearly") {
        renderYearlyRevenueChart(data.revenue || []);
      }
    } catch (error) {
      console.error("Seller revenue chart failed:", error);
    }
  }

  /* =========================================================
     DAILY REVENUE LINE GRAPH
  ========================================================= */

  function renderDailyRevenueChart(data) {
    const canvas = getElement("revenueChart");

    if (!canvas) return;

    destroyChart("revenue");

    const ctx = canvas.getContext("2d");

    /* =====================================================
       DATA
    ===================================================== */

    const labels = data.map((item) => `Day ${item.day}`);

    const values = data.map((item) => Number(item.revenue || 0));

    const orders = data.map((item) => Number(item.orders || 0));

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalRevenue = values.reduce((sum, value) => sum + value, 0);

    const totalOrders = orders.reduce((sum, value) => sum + value, 0);

    /* =====================================================
       GRADIENT
    ===================================================== */

    const gradient = createGradient(
      ctx,
      "rgba(31, 122, 50, 0.25)",
      "rgba(31, 122, 50, 0.01)",
    );

    /* =====================================================
       OPTIONS
    ===================================================== */

    const options = commonOptions();

    options.plugins.tooltip.callbacks = {
      label(context) {
        return ` Revenue: ${formatCurrency(context.raw)}`;
      },
    };

    /* =====================================================
       CHART
    ===================================================== */

    charts.revenue = new Chart(ctx, {
      type: "line",

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data: values,

            borderColor: COLORS.green,

            backgroundColor: gradient,

            borderWidth: 3,

            fill: true,

            tension: 0.42,

            pointRadius: 3,

            pointHoverRadius: 6,

            pointBackgroundColor: COLORS.green,

            pointBorderColor: "#ffffff",

            pointBorderWidth: 2,
          },
        ],
      },

      options,
    });

    /* =====================================================
       REVENUE OVERVIEW SUMMARY
    ===================================================== */

    updateChartRevenueSummary(totalRevenue, 0, totalOrders);
  }

  /* =========================================================
     YEARLY / MONTHLY REVENUE BAR GRAPH
  ========================================================= */

  function renderYearlyRevenueChart(data) {
    const canvas = getElement("revenueChart");

    if (!canvas) return;

    destroyChart("revenue");

    const labels = data.map((item) => item.year);

    const values = data.map((item) => Number(item.revenue || 0));

    charts.revenue = new Chart(canvas.getContext("2d"), {
      type: "bar",

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data: values,

            backgroundColor: COLORS.green,

            borderRadius: 7,

            borderSkipped: false,

            maxBarThickness: 42,
          },
        ],
      },

      options: {
        ...commonOptions(),

        plugins: {
          ...commonOptions().plugins,

          tooltip: {
            ...commonOptions().plugins.tooltip,

            callbacks: {
              label(context) {
                return ` Revenue: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },

        scales: {
          ...commonOptions().scales,

          y: {
            ...commonOptions().scales.y,

            ticks: {
              ...commonOptions().scales.y.ticks,

              callback(value) {
                return shortCurrency(value);
              },
            },
          },
        },
      },
    });

    const totalRevenue = values.reduce((sum, value) => sum + value, 0);

    const totalOrders = data.reduce(
      (sum, item) => sum + Number(item.orders || 0),
      0,
    );

    updateChartRevenueSummary(totalRevenue, 0, totalOrders);
  }

  /* =========================================================
     ORDERS VS REVENUE
  ========================================================= */

  async function loadOrdersRevenueChart() {
    try {
      const revenueData = await fetchJSON(
        `${API.revenue}?year=${new Date().getFullYear()}`,
      );

      const data = revenueData.revenue || [];

      renderOrdersRevenueChart(data);
    } catch (error) {
      console.error("Seller orders/revenue chart failed:", error);
    }
  }

  function renderOrdersRevenueChart(data) {
    const canvas = getElement("ordersRevenueChart");

    if (!canvas) return;

    destroyChart("ordersRevenue");

    const labels = data.map((item) => item.year ?? item.day ?? "");

    const revenue = data.map((item) => Number(item.revenue || 0));

    const orders = data.map((item) => Number(item.orders || 0));

    charts.ordersRevenue = new Chart(canvas.getContext("2d"), {
      type: "bar",

      data: {
        labels,

        datasets: [
          {
            type: "bar",

            label: "Revenue",

            data: revenue,

            backgroundColor: "rgba(31, 122, 50, 0.75)",

            borderRadius: 6,

            yAxisID: "revenue",
          },

          {
            type: "line",

            label: "Orders",

            data: orders,

            borderColor: COLORS.orange,

            backgroundColor: COLORS.orange,

            borderWidth: 3,

            tension: 0.4,

            pointRadius: 3,

            pointHoverRadius: 6,

            yAxisID: "orders",
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          mode: "index",

          intersect: false,
        },

        plugins: {
          legend: {
            display: true,

            position: "top",

            align: "end",

            labels: {
              boxWidth: 9,

              boxHeight: 9,

              usePointStyle: true,

              padding: 15,
            },
          },

          tooltip: {
            backgroundColor: "#17201a",

            callbacks: {
              label(context) {
                if (context.dataset.label === "Revenue") {
                  return ` Revenue: ${formatCurrency(context.raw)}`;
                }

                return ` Orders: ${formatNumber(context.raw)}`;
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            border: {
              display: false,
            },
          },

          revenue: {
            type: "linear",

            position: "left",

            beginAtZero: true,

            grid: {
              color: COLORS.grid,
            },

            ticks: {
              callback(value) {
                return shortCurrency(value);
              },
            },
          },

          orders: {
            type: "linear",

            position: "right",

            beginAtZero: true,

            grid: {
              drawOnChartArea: false,
            },

            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  /* =========================================================
     ORDER STATUS DOUGHNUT
  ========================================================= */

  async function loadOrderStatusChart() {
    try {
      const data = await fetchJSON(API.orders);

      renderOrderStatusChart(data.orders || []);
    } catch (error) {
      console.error("Seller order status chart failed:", error);
    }
  }

  function renderOrderStatusChart(data) {
    const canvas = getElement("orderStatusChart");

    if (!canvas) return;

    destroyChart("orderStatus");

    const labels = data.map((item) => capitalize(item.status));

    const values = data.map((item) => Number(item.totalOrders || 0));

    const colors = [
      COLORS.green,
      COLORS.blue,
      COLORS.orange,
      COLORS.red,
      COLORS.purple,
      COLORS.teal,
    ];

    charts.orderStatus = new Chart(canvas.getContext("2d"), {
      type: "doughnut",

      data: {
        labels,

        datasets: [
          {
            data: values,

            backgroundColor: colors.slice(0, values.length),

            borderWidth: 3,

            borderColor: "#ffffff",

            hoverOffset: 8,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        cutout: "68%",

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            backgroundColor: "#17201a",

            callbacks: {
              label(context) {
                return ` ${context.label}: ${formatNumber(context.raw)}`;
              },
            },
          },
        },
      },
    });

    renderOrderStatusLegend(labels, values, colors);
  }

  function renderOrderStatusLegend(labels, values, colors) {
    const container = getElement("orderStatusLegend");

    if (!container) return;

    container.innerHTML = labels
      .map(
        (label, index) => `
          <div class="chart-legend-item">

            <span
              class="chart-legend-dot"
              style="background:${colors[index]};"
            ></span>

            <span>
              ${escapeHTML(label)}
              (${formatNumber(values[index])})
            </span>

          </div>
        `,
      )
      .join("");
  }

  /* =========================================================
     CATEGORY BAR GRAPH
  ========================================================= */

  async function loadCategoryChart() {
    try {
      const data = await fetchJSON(API.categories);

      renderCategoryChart(data.categories || []);
    } catch (error) {
      console.error("Seller category chart failed:", error);
    }
  }

  function renderCategoryChart(data) {
    const canvas = getElement("categoryRevenueChart");

    if (!canvas) return;

    destroyChart("category");

    const labels = data.map((item) => item.name);

    const values = data.map((item) => Number(item.revenue || 0));

    charts.category = new Chart(canvas.getContext("2d"), {
      type: "bar",

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data: values,

            backgroundColor: COLORS.green,

            borderRadius: 6,

            borderSkipped: false,

            maxBarThickness: 32,
          },
        ],
      },

      options: {
        ...commonOptions(),

        indexAxis: "y",

        plugins: {
          ...commonOptions().plugins,

          tooltip: {
            ...commonOptions().plugins.tooltip,

            callbacks: {
              label(context) {
                return ` Revenue: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,

            grid: {
              color: COLORS.grid,
            },

            ticks: {
              callback(value) {
                return shortCurrency(value);
              },
            },
          },

          y: {
            grid: {
              display: false,
            },

            ticks: {
              color: COLORS.text,
            },
          },
        },
      },
    });
  }

  /* =========================================================
     YEARLY PERFORMANCE
  ========================================================= */

  async function loadYearlyPerformance() {
    try {
      const data = await fetchJSON(
        `${API.revenue}?year=${new Date().getFullYear()}`,
      );

      renderYearlyPerformance(data.revenue || []);
    } catch (error) {
      console.error("Seller yearly performance failed:", error);
    }
  }

  function renderYearlyPerformance(data) {
    const canvas = getElement("yearlyRevenueChart");

    if (!canvas) return;

    destroyChart("yearly");

    const labels = data.map((item) => item.year);

    const values = data.map((item) => Number(item.revenue || 0));

    charts.yearly = new Chart(canvas.getContext("2d"), {
      type: "bar",

      data: {
        labels,

        datasets: [
          {
            label: "Revenue",

            data: values,

            backgroundColor: data.map((item) =>
              item.source === "database"
                ? COLORS.green
                : "rgba(31, 122, 50, 0.28)",
            ),

            borderColor: data.map((item) =>
              item.source === "database"
                ? COLORS.greenDark
                : "rgba(31, 122, 50, 0.35)",
            ),

            borderWidth: 1,

            borderRadius: 7,

            borderSkipped: false,

            maxBarThickness: 42,
          },
        ],
      },

      options: {
        ...commonOptions(),

        plugins: {
          ...commonOptions().plugins,

          legend: {
            display: false,
          },

          tooltip: {
            ...commonOptions().plugins.tooltip,

            callbacks: {
              title(items) {
                return `Year ${items[0].label}`;
              },

              label(context) {
                const item = data[context.dataIndex];

                return [
                  ` Revenue: ${formatCurrency(context.raw)}`,

                  ` Orders: ${formatNumber(item.orders || 0)}`,

                  item.source === "historical"
                    ? " Historical data"
                    : " Actual database revenue",
                ];
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: COLORS.grid,
            },

            ticks: {
              callback(value) {
                return shortCurrency(value);
              },
            },
          },
        },
      },
    });

    const currentYear = new Date().getFullYear();

    const currentYearItem = data.find(
      (item) => Number(item.year) === currentYear,
    );

    const currentYearRevenue = getElement("currentYearRevenue");

    if (currentYearItem && currentYearRevenue) {
      currentYearRevenue.textContent = formatCurrency(currentYearItem.revenue);
    }
  }

  /* =========================================================
     TOP PRODUCTS
  ========================================================= */

  async function loadTopProducts() {
    const container = getElement("topProductsList");

    if (!container) return;

    try {
      const data = await fetchJSON(API.products);

      const products = data.products || [];

      if (!products.length) {
        container.innerHTML = `
          <div class="dashboard-empty-state">

            <i class="bi bi-box-seam"></i>

            <p>
              No sales data available yet.
            </p>

          </div>
        `;

        return;
      }

      container.innerHTML = products
        .map(
          (product, index) => `
            <div class="customer-card">

              <div class="customer-avatar">

                ${
                  product.image
                    ? `
                      <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                      >
                    `
                    : `
                      <span>
                        ${index + 1}
                      </span>
                    `
                }

              </div>


              <div class="customer-info">

                <strong>
                  ${escapeHTML(product.name || "Unknown Product")}
                </strong>

                <span>
                  ${formatNumber(product.totalSold || 0)}
                  units sold
                </span>

              </div>


              <div class="customer-meta">

                <strong>
                  ${formatCurrency(product.revenue || 0)}
                </strong>

                <span>
                  ${product.stock ?? 0}
                  in stock
                </span>

              </div>

            </div>
          `,
        )
        .join("");
    } catch (error) {
      console.error("Seller top products failed:", error);

      container.innerHTML = `
        <div class="dashboard-error">
          Failed to load top products.
        </div>
      `;
    }
  }

  /* =========================================================
     RECENT ORDERS
  ========================================================= */

  async function loadRecentOrders() {
    const tbody = getElement("recentOrdersTable");

    if (!tbody) return;

    try {
      const data = await fetchJSON(API.recentOrders);

      const orders = data.orders || [];

      if (!orders.length) {
        tbody.innerHTML = `
          <tr>

            <td
              colspan="5"
              class="table-loading"
            >
              No orders found.
            </td>

          </tr>
        `;

        return;
      }

      tbody.innerHTML = orders
        .map(
          (order) => `
            <tr>

              <!-- ORDER -->

              <td>
                <strong>
                  ${escapeHTML(order.orderNumber || order._id || "—")}
                </strong>
              </td>


              <!-- CUSTOMER -->

              <td>
                ${escapeHTML(order.customer?.name || "Guest")}
              </td>


              <!-- AMOUNT -->

              <td>
                <strong>
                  ${formatCurrency(order.totalAmount || 0)}
                </strong>
              </td>


              <!-- ORDER STATUS -->

              <td>

                <span
                  class="
                    dashboard-status
                    ${String(order.orderStatus || "pending").toLowerCase()}
                  "
                >
                  ${escapeHTML(order.orderStatus || "Pending")}
                </span>

              </td>


              <!-- PAYMENT -->

              <td>

                <span
                  class="dashboard-status paid"
                >
                  ${escapeHTML(order.paymentMethod || "Razorpay")}
                </span>

              </td>

            </tr>
          `,
        )
        .join("");
    } catch (error) {
      console.error("Seller recent orders failed:", error);

      tbody.innerHTML = `
        <tr>

          <td
            colspan="5"
            class="table-loading"
          >
            Failed to load recent orders.
          </td>

        </tr>
      `;
    }
  }

  /* =========================================================
     INVENTORY
  ========================================================= */

  async function loadInventory() {
    try {
      const data = await fetchJSON(API.inventory);

      const inventory = data.inventory || {};

      /* =====================================================
         HEALTHY STOCK
      ===================================================== */

      const inventoryInStockElement = getElement("inventoryInStock");

      if (inventoryInStockElement) {
        inventoryInStockElement.textContent = formatNumber(
          inventory.healthyStock || 0,
        );
      }

      /* =====================================================
         LOW STOCK
      ===================================================== */

      const inventoryLowStockElement = getElement("inventoryLowStock");

      if (inventoryLowStockElement) {
        inventoryLowStockElement.textContent = formatNumber(
          inventory.lowStock || 0,
        );
      }

      /* =====================================================
         OUT OF STOCK
      ===================================================== */

      const inventoryOutOfStockElement = getElement("inventoryOutOfStock");

      if (inventoryOutOfStockElement) {
        inventoryOutOfStockElement.textContent = formatNumber(
          inventory.outOfStock || 0,
        );
      }

      /* =====================================================
         TOTAL
      ===================================================== */

      const inventoryTotalElement = getElement("inventoryTotal");

      if (inventoryTotalElement) {
        const total = Number(inventory.totalProducts || inventory.total || 0);

        inventoryTotalElement.textContent = formatNumber(total);
      }
    } catch (error) {
      console.error("Seller inventory failed:", error);
    }
  }

  /* =========================================================
     TOP BRANDS
  ========================================================= */

  async function loadBrandChart() {
    const canvas = getElement("brandRevenueChart");

    if (!canvas) return;

    try {
      const data = await fetchJSON(API.brands);

      const brands = data.brands || [];

      destroyChart("brands");

      charts.brands = new Chart(canvas.getContext("2d"), {
        type: "bar",

        data: {
          labels: brands.map((item) => item.name),

          datasets: [
            {
              label: "Revenue",

              data: brands.map((item) => Number(item.revenue || 0)),

              backgroundColor: COLORS.blue,

              borderRadius: 6,

              borderSkipped: false,
            },
          ],
        },

        options: {
          ...commonOptions(),

          plugins: {
            ...commonOptions().plugins,

            tooltip: {
              ...commonOptions().plugins.tooltip,

              callbacks: {
                label(context) {
                  return ` Revenue: ${formatCurrency(context.raw)}`;
                },
              },
            },
          },

          scales: {
            y: {
              beginAtZero: true,

              ticks: {
                callback(value) {
                  return shortCurrency(value);
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Seller brand chart failed:", error);
    }
  }

  /* =========================================================
     INVENTORY CHART
     Optional if canvas exists
  ========================================================= */

  async function loadInventoryChart() {
    const canvas = getElement("inventoryStatusChart");

    if (!canvas) return;

    try {
      const data = await fetchJSON(API.inventory);

      const inventory = data.inventory || {};

      destroyChart("inventory");

      charts.inventory = new Chart(canvas.getContext("2d"), {
        type: "doughnut",

        data: {
          labels: ["Healthy Stock", "Low Stock", "Out of Stock"],

          datasets: [
            {
              data: [
                inventory.healthyStock || 0,

                inventory.lowStock || 0,

                inventory.outOfStock || 0,
              ],

              backgroundColor: [COLORS.green, COLORS.orange, COLORS.red],

              borderColor: "#ffffff",

              borderWidth: 3,

              hoverOffset: 8,
            },
          ],
        },

        options: {
          responsive: true,

          maintainAspectRatio: false,

          cutout: "65%",

          plugins: {
            legend: {
              display: true,

              position: "bottom",

              labels: {
                usePointStyle: true,

                boxWidth: 8,

                padding: 12,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Seller inventory chart failed:", error);
    }
  }

  /* =========================================================
     PAYMENT CHART
     Optional if canvas exists
  ========================================================= */

  async function loadPaymentChart() {
    const canvas = getElement("paymentMethodChart");

    if (!canvas) return;

    /*
     * No payment-method endpoint is
     * currently configured for the seller
     * dashboard.
     *
     * Leave this disabled until the
     * seller payment-method route exists.
     */

    console.info(
      "Payment chart canvas detected. No seller payment-method API configured.",
    );
  }

  /* =========================================================
     DATE FILTER
  ========================================================= */

  function initializeDateFilter() {
    const button = getElement("dashboardDateButton");

    const filter = getElement("dashboardDateFilter");

    /*
     * Your current seller EJS does not
     * have dashboardDateButton.
     *
     * Therefore this safely does nothing.
     */

    if (!button || !filter) {
      return;
    }

    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const isHidden = filter.hidden;

      filter.hidden = !isHidden;

      button.setAttribute("aria-expanded", String(isHidden));
    });

    document.addEventListener("click", () => {
      filter.hidden = true;

      button.setAttribute("aria-expanded", "false");
    });

    filter.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    $$(".date-filter-option").forEach((option) => {
      option.addEventListener("click", () => {
        const range = option.dataset.range;

        $$(".date-filter-option").forEach((item) =>
          item.classList.remove("active"),
        );

        option.classList.add("active");

        currentDateRange = range;

        const text = getElement("dashboardDateText");

        if (text) {
          text.textContent = option.textContent.trim();
        }

        const customRange = getElement("dashboardCustomRange");

        if (customRange) {
          customRange.hidden = range !== "custom";
        }

        if (range !== "custom") {
          filter.hidden = true;

          refreshDashboard();
        }
      });
    });

    const applyButton = getElement("applyCustomRange");

    if (applyButton) {
      applyButton.addEventListener("click", () => {
        const start = getElement("dashboardStartDate")?.value;

        const end = getElement("dashboardEndDate")?.value;

        if (!start || !end) {
          alert("Please select both start and end dates.");

          return;
        }

        if (start > end) {
          alert("Start date cannot be after end date.");

          return;
        }

        const text = getElement("dashboardDateText");

        if (text) {
          text.textContent = `${start} → ${end}`;
        }

        filter.hidden = true;

        refreshDashboard();
      });
    }
  }

  /* =========================================================
     CHART PERIOD SELECTOR
  ========================================================= */

  function initializeChartPeriod() {
    $$(".chart-period").forEach((button) => {
      button.addEventListener("click", async () => {
        $$(".chart-period").forEach((item) => item.classList.remove("active"));

        button.classList.add("active");

        currentRevenuePeriod = button.dataset.period;

        await loadRevenueChart(currentRevenuePeriod);
      });
    });
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  async function refreshDashboard() {
    const button = getElement("dashboardRefresh");

    if (button) {
      button.classList.add("loading");

      button.disabled = true;
    }

    try {
      await Promise.all([
        loadStatistics(),

        loadRevenueChart(currentRevenuePeriod),

        loadOrdersRevenueChart(),

        loadOrderStatusChart(),

        loadCategoryChart(),

        loadYearlyPerformance(),

        loadTopProducts(),

        loadRecentOrders(),

        loadInventory(),

        loadBrandChart(),

        loadInventoryChart(),

        loadPaymentChart(),
      ]);

      updateLastUpdated();
    } catch (error) {
      console.error("Seller dashboard refresh failed:", error);
    } finally {
      if (button) {
        button.classList.remove("loading");

        button.disabled = false;
      }
    }
  }

  /* =========================================================
     LAST UPDATED
  ========================================================= */

  function updateLastUpdated() {
    const element = getElement("dashboardLastUpdated");

    if (!element) return;

    element.textContent = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit",
    });
  }

  /* =========================================================
     UTILITIES
  ========================================================= */

  function capitalize(value) {
    if (!value) {
      return "Unknown";
    }

    return (
      String(value).charAt(0).toUpperCase() +
      String(value).slice(1).toLowerCase()
    );
  }

  function getMonthName(month) {
    const names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return names[Number(month) - 1] || "";
  }

  /* =========================================================
     REFRESH BUTTON
  ========================================================= */

  function initializeRefreshButton() {
    const button = document.querySelector(".dashboard-refresh-btn");

    if (!button) {
      console.warn("Seller dashboard refresh button not found.");

      return;
    }

    button.addEventListener("click", async (event) => {
      event.preventDefault();

      await refreshDashboard();
    });
  }

  /* =========================================================
     INITIALIZE
  ========================================================= */

  async function initializeDashboard() {
    initializeDateFilter();

    initializeChartPeriod();

    initializeRefreshButton();

    await refreshDashboard();
  }

  /* =========================================================
     DOM READY
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDashboard);
  } else {
    initializeDashboard();
  }
})();
