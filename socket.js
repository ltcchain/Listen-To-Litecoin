//var satoshi = 100000000;
var satoshi = 1;

var DELAY_CAP = 1000;

var lastBlockHeight = 0;

function TransactionSocket() {

}

TransactionSocket.init = function () {
    if (Modernizr.websockets) {

        if (this.connection)
            this.connection.close();

        //var connection = new ReconnectingWebSocket('ws://ltcsocket-c9-carlospaulino.c9.io');
        var connection = new ReconnectingWebSocket('ws://ws-ltcchain.rhcloud.com:8000');
        this.connection = connection;

        StatusBox.reconnecting("blockchain");

        connection.onopen = function () {
            console.log('LTCchain.com: Connection open!');
            StatusBox.connected("blockchain");
            var newTransactions = {
                "op": "tx_sub"
            };
            var newBlocks = {
                "op": "blocks_sub"
            };
            connection.send(JSON.stringify(newTransactions));
            connection.send(JSON.stringify(newBlocks));
            /*
            connection.send(JSON.stringify({
            "op" : "ping_tx"
            }));
            */
            // Display the latest transaction so the user sees something.
        }

        connection.onclose = function () {
            console.log('ltcChain.com: Connection closed');
            if ($("#blockchainCheckBox").prop("checked"))
                StatusBox.reconnecting("blockchain");
            else
                StatusBox.closed("blockchain");
        }

        connection.onerror = function (error) {
            console.log('LTCchain.com: Connection Error: ' + error);
        }

        connection.onmessage = function (e) {
            var data = JSON.parse(e.data);

            //console.log(JSON.stringify(data));

            // New Transaction
            if (data.op == "utx") {
                var transacted = 0;

                for (var i = 0; i < data.x.out.length; i++) {
                    transacted += data.x.out[i].value;
                }

                var bitcoins = transacted / satoshi;
                //console.log("Transaction: " + bitcoins + " BTC");

                var donation = false;
                var soundDonation = false;
                var outputs = data.x.out;
                for (var i = 0; i < outputs.length; i++) {
                    if ((outputs[i].addr) == DONATION_ADDRESS || (outputs[i].addr) == SOUND_DONATION_ADDRESS) {
                        bitcoins = data.x.out[i].value / satoshi;
                        new Transaction(bitcoins, true);
                        return;
                    }
                }

                setTimeout(function () {
                    new Transaction(bitcoins);
                }, Math.random() * DELAY_CAP);

            } else if (data.op == "block") {
                var blockHeight = data.x.height;
                var transactions = data.x.nTx;
                //var volumeSent = data.x.estimatedBTCSent;
                var blockSize = data.x.size;
                // Filter out the orphaned blocks.
                if (blockHeight > lastBlockHeight) {
                    lastBlockHeight = blockHeight;
                    console.log("New Block");
                    new Block(blockHeight, transactions, blockSize);
                }
            }

        }
    } else {
        //WebSockets are not supported.
        console.log("No websocket support.");
        StatusBox.nosupport("blockchain");
    }
}