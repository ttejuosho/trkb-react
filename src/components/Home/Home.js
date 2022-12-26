import React, { useContext, useEffect } from "react";
import { Container } from "react-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

const Home = () => {
  const { companyUID, locationUID, companyName, userId, token } = useContext(
    UserContext
  );
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  const getLocationNames = (data) => {
    let locationNames = data.map((l) => {
      return l.locationName;
    });
    return locationNames;
  };

  const getTransactionCounts = (data) => {
    let transactionCounts = data.map((t) => {
      return t.transactionCount;
    });
    return transactionCounts;
  };

  const getTransactionAmounts = (data) => {
    let transactionAmounts = data.map((ta) => {
      return ta.transactionAmount;
    });
    return transactionAmounts;
  };

  const getTransactionCharges = (data) => {
    let transactionCharges = data.map((tc) => {
      return tc.transactionCharge;
    });
    return transactionCharges;
  };

  const getPosCharges = (data) => {
    let posCharges = data.map((pc) => {
      return pc.posCharge;
    });
    return posCharges;
  };

  const getEstimatedProfits = (data) => {
    let estimatedProfits = data.map((ep) => {
      return ep.estimatedProfit;
    });
    return estimatedProfits;
  };

  // const buildTransactionsChart = (locationNames, transactionCounts) => {
  //   var ctx = $("#transactionsChart");
  //   var transactionsChart = new Chart(ctx, {
  //     type: "bar",
  //     data: {
  //       labels: locationNames,
  //       datasets: [
  //         {
  //           label: ["Transactions By Locations"],
  //           data: transactionCounts,
  //           backgroundColor: [
  //             "rgba(54, 162, 235, 0.2)",
  //             "rgba(255, 99, 132, 0.2)",
  //             "rgba(255, 206, 86, 0.2)",
  //             "rgba(75, 192, 192, 0.2)",
  //             "rgba(153, 102, 255, 0.2)",
  //             "rgba(255, 159, 64, 0.2)",
  //           ],
  //           borderColor: [
  //             "rgba(54, 162, 235, 1)",
  //             "rgba(255, 99, 132, 1)",
  //             "rgba(255, 206, 86, 1)",
  //             "rgba(75, 192, 192, 1)",
  //             "rgba(153, 102, 255, 1)",
  //             "rgba(255, 159, 64, 1)",
  //           ],
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         yAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //               min: 0,
  //               suggestedMax: 8,
  //               stepSize: 1,
  //             },
  //           },
  //         ],
  //         xAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //       },
  //       responsive: true,
  //     },
  //   });
  // };

  // const buildTransactionAmountsChart = (locationNames, transactionAmounts) => {
  //   var ctx = $("#transactionAmountsChart");
  //   var transactionAmountsChart = new Chart(ctx, {
  //     type: "bar",
  //     data: {
  //       labels: locationNames,
  //       datasets: [
  //         {
  //           label: [`Transaction Amounts By Locations`],
  //           data: transactionAmounts,
  //           backgroundColor: [
  //             "rgba(255, 99, 132, 0.2)",
  //             "rgba(54, 162, 235, 0.2)",
  //             "rgba(255, 206, 86, 0.2)",
  //             "rgba(75, 192, 192, 0.2)",
  //             "rgba(153, 102, 255, 0.2)",
  //             "rgba(255, 159, 64, 0.2)",
  //           ],
  //           borderColor: [
  //             "rgba(255, 99, 132, 1)",
  //             "rgba(54, 162, 235, 1)",
  //             "rgba(255, 206, 86, 1)",
  //             "rgba(75, 192, 192, 1)",
  //             "rgba(153, 102, 255, 1)",
  //             "rgba(255, 159, 64, 1)",
  //           ],
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         yAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //         xAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //       },
  //       responsive: true,
  //     },
  //   });
  // };

  // const buildEstimatedProfitsChart = (locationNames, estimatedProfits) => {
  //   var epctx = $("#estimatedProfitsChart");
  //   var estimatedProfitsChart = new Chart(epctx, {
  //     type: "bar",
  //     data: {
  //       labels: locationNames,
  //       datasets: [
  //         {
  //           label: ["Estimated Profits By Locations"],
  //           data: estimatedProfits,
  //           backgroundColor: [
  //             "rgba(50, 205, 50, 0.5)",
  //             "rgba(54, 162, 235, 0.2)",
  //             "rgba(255, 206, 86, 0.2)",
  //             "rgba(75, 192, 192, 0.2)",
  //             "rgba(153, 102, 255, 0.2)",
  //             "rgba(255, 159, 64, 0.2)",
  //           ],
  //           borderColor: [
  //             "rgba(50, 205, 50, 1)",
  //             "rgba(54, 162, 235, 1)",
  //             "rgba(255, 206, 86, 1)",
  //             "rgba(75, 192, 192, 1)",
  //             "rgba(153, 102, 255, 1)",
  //             "rgba(255, 159, 64, 1)",
  //           ],
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         yAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //         xAxes: [
  //           {
  //             ticks: {
  //               beginAtZero: true,
  //             },
  //           },
  //         ],
  //       },
  //       responsive: true,
  //     },
  //   });
  // };

  // const buildChargesChart = (locationNames, posCharges, transactionCharges) => {
  //   var cctx = $("#chargesChart");
  //   var chargesChart = new Chart(cctx, {
  //     type: "line",
  //     data: {
  //       labels: locationNames,
  //       datasets: [
  //         {
  //           label: "POS Charges",
  //           data: posCharges,
  //           backgroundColor: "transparent",
  //           borderColor: ["rgba(153, 102, 255, 1)", "rgba(153, 102, 255, 0.2)"],
  //         },
  //         {
  //           label: "Transaction Charges",
  //           data: transactionCharges,
  //           backgroundColor: "transparent",
  //           borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 0.2)"],
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         y: {
  //           beginAtZero: true,
  //         },
  //       },
  //       responsive: true,
  //     },
  //   });
  // };

  useEffect(() => {
    console.log("useEffect inEffect");
    fetch(`/api/transactions/getMostRecent`, {
      method: "GET",
    })
      .then(async (response) => {
        let data = await response.json();
        console.log(data);
        if (response.ok) {
          console.log(data);
        }

        //   res.forEach((transaction) => {
        //     var transactionData = `
        // <tr>
        //   <td>${transaction.locationName}</td>
        //   <td>${transaction.transactionTerminal}</td>
        //   <td>&#8358;${numeral(transaction.transactionAmount).format(
        //     "0,0.00"
        //   )}</td>
        //   <td>${transaction.transactionType}</td>
        //   <td>${transaction.preparedBy}</td>
        //   <td>${moment(transaction.createdAt).fromNow()}</td>
        // </tr>
        // `;
        //     $("#recentActivity").append(transactionData);
        // });
      })
      .catch((error) => {
        console.error(error);
      });

    fetch(`/api/expense`)
      .then(async (response) => {
        let data = await response.json();
        console.log(data);
        if (response.ok) {
          console.log(data);
        }
        //   res.forEach((expense) => {
        //     var expenseData = `
        // <tr>
        //   <td>${expense.item}</td>
        //   <td>${expense.expenseCategory}</td>
        //   <td>&#8358;${numeral(expense.expenseAmount).format("0,0.00")}</td>
        //   <td>${moment(expense.expenseDate).format("MM/DD/YYYY")}</td>
        //   <td>${expense.notes}</td>
        // </tr>
        // `;
        //     $("#expenses").append(expenseData);
        //});
      })
      .catch((error) => {
        console.error(error);
      });

    //fetchDashboardData();
  }, []);

  const getLocationChartsData = (timeFrame) => {
    fetch(
      process.env.REACT_APP_API_ENDPOINT +
        "/api/transactions/chart/byLocation/" +
        timeFrame,
      {
        method: "GET",
        //credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then(async (response) => {
        let data = await response.json();
        if (response.ok) {
          console.log(data);
          // let locationNames = getLocationNames(data);
          // let transactionCounts = getTransactionCounts(data);
          // let transactionAmounts = getTransactionAmounts(data);
          // let transactionCharges = getTransactionCharges(data);
          // let posCharges = getPosCharges(data);
          // let estimatedProfits = getEstimatedProfits(data);
          // console.log(data);
          // console.log(locationNames);
          // console.log(transactionCounts);
          // console.log(transactionAmounts);
          // console.log(transactionCharges);
          // console.log(posCharges);
          // console.log(estimatedProfits);
          // buildTransactionsChart(locationNames, transactionCounts);
          // buildTransactionAmountsChart(locationNames, transactionAmounts);
          // buildEstimatedProfitsChart(locationNames, estimatedProfits);
          // buildChargesChart(locationNames, posCharges, transactionCharges);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const onTimeChange = (event) => {
    event.preventDefault();
    console.log(event.target.id);
    getLocationChartsData(event.target.id);
  };

  return (
    <>
      <Container>
        <Row className="mt-3 justify-content-center">
          <Col>
            <p>Reporting Period</p>
            <InputGroup className="mb-3">
              <Button
                variant="outline-secondary"
                id="day"
                onClick={onTimeChange}
              >
                1D
              </Button>
              <Button
                variant="outline-secondary"
                id="week"
                onClick={onTimeChange}
              >
                1W
              </Button>
              <Button
                variant="outline-secondary"
                id="month"
                onClick={onTimeChange}
              >
                1M
              </Button>
              <Button
                variant="outline-secondary"
                id="3months"
                onClick={onTimeChange}
              >
                3M
              </Button>
              <Button
                variant="outline-secondary"
                id="6months"
                onClick={onTimeChange}
              >
                6M
              </Button>
              <Button
                variant="outline-secondary"
                id="year"
                onClick={onTimeChange}
              >
                1Y
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default Home;
