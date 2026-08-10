/* =========================================================
   PLANTORA ADMIN DASHBOARD
   Dashboard Analytics / Charts / Tables
========================================================= */

(() => {
  "use strict";

  /* =========================================================
     CONFIG
  ========================================================= */

  const API = {
    statistics: "/admin/dashboard/statistics",
    revenue: "/admin/dashboard/revenue-chart",
    orders: "/admin/dashboard/orders-chart",
    users: "/admin/dashboard/users-chart",
    inventory: "/admin/dashboard/inventory-chart",
    products: "/admin/dashboard/top-products",
    categories: "/admin/dashboard/top-categories",
    brands: "/admin/dashboard/top-brands",
    sellers: "/admin/dashboard/top-sellers",
    recentOrders: "/admin/dashboard/recent-orders",
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

    element.classList.remove("negative", "neutral");

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

      getElement("totalRevenue").textContent = formatCurrency(
        stats.revenue?.total || 0,
      );

      updateGrowth("revenueGrowth", stats.revenue?.growth || 0);

      /* =====================================================
       ORDERS
    ===================================================== */

      getElement("totalOrders").textContent = formatNumber(
        stats.orders?.total || 0,
      );

      updateGrowth("ordersGrowth", stats.orders?.growth || 0);

      /* =====================================================
       CUSTOMERS
    ===================================================== */

      getElement("totalCustomers").textContent = formatNumber(
        stats.customers?.total || 0,
      );

      updateGrowth("customerGrowth", stats.customers?.growth || 0);

      /* =====================================================
       PRODUCTS SOLD
    ===================================================== */

      getElement("productsSold").textContent = formatNumber(
        stats.sales?.itemsSold || 0,
      );

      /* =====================================================
       AVERAGE ORDER VALUE
    ===================================================== */

      getElement("averageOrderValue").textContent = formatCurrency(
        stats.sales?.averageOrderValue || 0,
      );

      /* =====================================================
       SUCCESSFUL ORDERS
       Only update if this element exists in EJS
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

      /* Total Products KPI */

      const totalProductsElement = getElement("totalProducts");

      if (totalProductsElement) {
        totalProductsElement.textContent = formatNumber(totalProducts);
      }

      /* Active Products */

      const activeProductsElement = getElement("activeProducts");

      if (activeProductsElement) {
        activeProductsElement.textContent = formatNumber(
          stats.products?.active || 0,
        );
      }

      /* Inventory - Healthy Stock */

      const inventoryInStockElement = getElement("inventoryInStock");

      if (inventoryInStockElement) {
        inventoryInStockElement.textContent = formatNumber(healthyStock);
      }

      /* Inventory - Low Stock */

      const inventoryLowStockElement = getElement("inventoryLowStock");

      if (inventoryLowStockElement) {
        inventoryLowStockElement.textContent = formatNumber(lowStock);
      }

      /* Inventory - Out of Stock */

      const inventoryOutOfStockElement = getElement("inventoryOutOfStock");

      if (inventoryOutOfStockElement) {
        inventoryOutOfStockElement.textContent = formatNumber(outOfStock);
      }

      /* Inventory - Total */

      const inventoryTotalElement = getElement("inventoryTotal");

      if (inventoryTotalElement) {
        inventoryTotalElement.textContent = formatNumber(totalProducts);
      }

      /* =====================================================
       CURRENT YEAR
    ===================================================== */

      getElement("currentYearRevenue").textContent = formatCurrency(
        stats.revenue?.thisYear || 0,
      );

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
      console.error("Dashboard statistics failed:", error);
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

      /*
       * Controller supports:
       * yearly = no month
       * daily = month + year
       */

      const now = new Date();

      const year = now.getFullYear();

      const month = now.getMonth() + 1;

      if (period === "daily") {
        url += `?year=${year}&month=${month}`;
      }

      if (period === "monthly") {
        /*
         * Current controller does not expose a separate
         * monthly endpoint. We therefore use yearly data
         * and display the available yearly revenue.
         */
        url += `?year=${year}`;
      }

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
      console.error("Revenue chart failed:", error);
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

    /*
     * IMPORTANT:
     * Orders come from the same successful/paid
     * revenue aggregation.
     *
     * Pending orders should NOT be included by
     * the backend revenue query.
     */

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
     YEARLY REVENUE BAR GRAPH
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
      console.error("Orders/revenue chart failed:", error);
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
      console.error("Order status chart failed:", error);
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
                style="
                  background:${colors[index]};
                "
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
      console.error("Category chart failed:", error);
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
     CUSTOMER GROWTH
  ========================================================= */

  async function loadCustomerGrowthChart() {
    try {
      const data = await fetchJSON(API.users);

      renderCustomerGrowthChart(data.users || []);
    } catch (error) {
      console.error("Customer growth chart failed:", error);
    }
  }

  function renderCustomerGrowthChart(data) {
    const canvas = getElement("customerGrowthChart");

    if (!canvas) return;

    destroyChart("customers");

    const sorted = [...data].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );

    const labels = sorted.map(
      (item) => `${getMonthName(item.month)} ${item.year}`,
    );

    const values = sorted.map((item) => Number(item.totalUsers || 0));

    charts.customers = new Chart(canvas.getContext("2d"), {
      type: "line",

      data: {
        labels,

        datasets: [
          {
            label: "New Customers",

            data: values,

            borderColor: COLORS.purple,

            backgroundColor: "rgba(128, 100, 199, 0.12)",

            fill: true,

            tension: 0.4,

            borderWidth: 3,

            pointRadius: 3,

            pointHoverRadius: 6,

            pointBackgroundColor: COLORS.purple,

            pointBorderColor: "#ffffff",

            pointBorderWidth: 2,
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
                return ` New Customers: ${formatNumber(context.raw)}`;
              },
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
      console.error("Yearly performance failed:", error);
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

                  ` Orders: ${formatNumber(item.orders)}`,

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

    if (currentYearItem) {
      getElement("currentYearRevenue").textContent = formatCurrency(
        currentYearItem.revenue,
      );
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
            <p>No sales data available yet.</p>
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
                      ? `<img
                          src="${escapeHTML(product.image)}"
                          alt="${escapeHTML(product.name)}"
                        >`
                      : `<span>
                          ${index + 1}
                        </span>`
                  }
                </div>

                <div class="customer-info">
                  <strong>
                    ${escapeHTML(product.name || "Unknown Product")}
                  </strong>

                  <span>
                    ${formatNumber(product.totalSold)}
                    units sold
                  </span>
                </div>

                <div class="customer-meta">
                  <strong>
                    ${formatCurrency(product.revenue)}
                  </strong>

                  <span>
                    ${product.stock ?? 0} in stock
                  </span>
                </div>

              </div>
            `,
        )
        .join("");
    } catch (error) {
      console.error("Top products failed:", error);

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

            <!-- STATUS -->
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
              <span class="dashboard-status paid">
                Razorpay
              </span>
            </td>

          </tr>
        `,
        )
        .join("");
    } catch (error) {
      console.error("Recent orders failed:", error);

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

      /*
       * Your controller returns:
       * healthyStock
       * lowStock
       * outOfStock
       */

      if (getElement("inventoryInStock")) {
        getElement("inventoryInStock").textContent = formatNumber(
          inventory.healthyStock,
        );
      }

      if (getElement("inventoryLowStock")) {
        getElement("inventoryLowStock").textContent = formatNumber(
          inventory.lowStock,
        );
      }

      if (getElement("inventoryOutOfStock")) {
        getElement("inventoryOutOfStock").textContent = formatNumber(
          inventory.outOfStock,
        );
      }
    } catch (error) {
      console.error("Inventory failed:", error);
    }
  }

  /* =========================================================
     TOP BRANDS
     Optional chart if canvas exists
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
      console.error("Brand chart failed:", error);
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
      console.error("Inventory chart failed:", error);
    }
  }

  /* =========================================================
     PAYMENT CHART
     Will automatically work if the canvas and route are added.
  ========================================================= */

  async function loadPaymentChart() {
    const canvas = getElement("paymentMethodChart");

    if (!canvas) return;

    /*
     * Your current route file does NOT yet expose:
     *
     * /admin/dashboard/payment-methods
     *
     * So this function intentionally does nothing
     * until that route exists.
     */

    console.info(
      "Payment chart canvas detected. Add payment-method route to enable it.",
    );
  }

  /* =========================================================
     DATE FILTER
  ========================================================= */

  function initializeDateFilter() {
    const button = getElement("dashboardDateButton");

    const filter = getElement("dashboardDateFilter");

    if (!button || !filter) return;

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

        loadCustomerGrowthChart(),

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
      console.error("Dashboard refresh failed:", error);
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
    if (!value) return "Unknown";

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
      console.warn("Dashboard refresh button not found.");
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
