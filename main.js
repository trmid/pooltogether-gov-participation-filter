window.addEventListener("load", () => {

  // Define constants:
  const governorAlpha = "0xB3a87172F555ae2a2AB79Be60B336D2F7D0187f0";
  const governorBravo = "0x8a907De47E00830a2b742db65e938a3ea1070A2E";
  const poolToken = "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e";
  
  const voteTopicAlpha = "0x877856338e13f63d0c36822ff0ef736b80934cd90574a3a5bc9262c39d217c46";
  const voteTopicBravo = "0xb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4";
  const delegateTopic = "0x3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f";

  // Get elements:
  const queryBtn = document.getElementById("query-btn");
  const rpcInput = document.getElementById("eth-rpc-input");
  const queryTypeSelect = document.getElementById("query-type-select");
  const resultBox = document.getElementById("result-box");

  // Get RPC from local storage:
  const storedRPC = localStorage.getItem("eth-rpc");
  if (storedRPC) rpcInput.value = storedRPC;

  // Vars:
  let rpcId = 0;

  // Add listeners:
  queryBtn.addEventListener("click", async () => {
    queryBtn.setAttribute("disabled", "true");
    resultBox.innerHTML = "loading...";
    try {
      const rpc = rpcInput.value;
      const queryType = queryTypeSelect.value;
      if (!rpc) return alert("Please enter an RPC URL...");
      if (!queryType) return alert("Missing query type...");

      // Store RPC:
      localStorage.setItem("eth-rpc", rpc);

      // Query:
      if (queryType === "delegators") {
        const res = await fetch(rpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: rpcId++,
            jsonrpc:"2.0",
            method:"eth_getLogs",
            params: [
              {
                fromBlock: "earliest",
                toBlock: "latest",
                address: poolToken,
                topics: [delegateTopic]
              }
            ]
          })
        });
        if (res.status !== 200) {
          throw new Error(res);
        }
        const body = await res.json();
        const delegators = new Set(body.result.map(x => `0x${x.topics[1].slice(-40)}`));
        alert(`${delegators.size} delegators found!`);
        resultBox.innerHTML = [...delegators].join("\n");
      } else if (queryType === "voters") {
        // Alpha:
        const alphaRes = await fetch(rpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: rpcId++,
            jsonrpc:"2.0",
            method:"eth_getLogs",
            params: [
              {
                fromBlock: "earliest",
                toBlock: "latest",
                address: governorAlpha,
                topics: [voteTopicAlpha]
              }
            ]
          })
        });
        if (alphaRes.status !== 200) {
          throw new Error(alphaRes);
        }

        // Bravo:
        const bravoRes = await fetch(rpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: rpcId++,
            jsonrpc:"2.0",
            method:"eth_getLogs",
            params: [
              {
                fromBlock: "earliest",
                toBlock: "latest",
                address: governorBravo,
                topics: [voteTopicBravo]
              }
            ]
          })
        });
        if (bravoRes.status !== 200) {
          throw new Error(bravoRes);
        }

        const alphaBody = await alphaRes.json();
        const bravoBody = await bravoRes.json();

        const voters = new Set(alphaBody.result.map(x => `0x${x.data.slice(26, 66)}`).concat(bravoBody.result.map(x => `0x${x.topics[1].slice(-40)}`)));
        alert(`${voters.size} voters found!`);
        resultBox.innerHTML = [...voters].join("\n");
      }
    } catch(err) {
      console.error(err);
      alert("Something went wrong... check console for errors.");
      resultBox.innerHTML = err.message ?? "" + err;
    } finally {
      queryBtn.removeAttribute("disabled");
    }
  });

});