import React, { Component } from 'react'
import axios from 'axios'
import detectEthereumProvider from '@metamask/detect-provider';
// import Tip from './Tip'
import './Transactions.css'
import {
    multiply, mean
  } from 'mathjs'

export class Transactions extends Component {
    constructor(props) {
        super(props)

        this.state = {
            info: {},
            errorMsg: '',
            transactions: [],
            address: ''
        }
    }

    // executed when the component is first mounted and will only execute once during the component's lifetime
    async componentDidMount() { 
        // console.log("entering componentDidMount")
        let address = -1
        try {
            const provider = await detectEthereumProvider();
        
            if (provider) {
                // From now on, this should always be true:
                // provider === window.ethereum
                const { ethereum } = window;
                try {
                // Will open the MetaMask UI
                // You should disable this button while the request is pending!
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                // console.log(accounts)
                
                address = accounts[0]
                
                } catch (error) {
                console.error(error);
                }
            } else {
                console.log('Please install MetaMask!');
            }
            // console.log(process.env)
        } catch (err) {
            console.log("Could not load metamask")
        }

        // let address = process.env.REACT_APP_TEST_ADDRESS
        console.log(address)
        let apikey = process.env.REACT_APP_BSCSCAN_APIKEY
        let transactions = []
        let info = {}

        const requestString = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=1&endblock=99999999&sort=asc&apikey=${apikey}`
        
        axios.get(requestString)
        .then(response => {
            // console.log(response.data.result);
            transactions = response.data.result
            
            const transactionsSent = transactions.filter(txn => txn.from === address.toLowerCase())
            // const transactionsSent = transactions => transactions.from 
            // console.log(transactionsSent)

            this.setState({transactions: transactions})

            // console.log("transactions")
            // console.log(transactions)

            const gasPrice = transactions.map(transactions => parseInt(transactions.gasPrice))
            const gasPriceTotal = gasPrice.reduce((a, b) => parseInt(a) + parseInt(b), 0)
            // console.log(gasPrice)

            const gasUsed = transactions.map(transactions => parseInt(transactions.gasUsed))
            const gasUsedTotal = gasUsed.reduce((a, b) => parseInt(a) + parseInt(b), 0)
            // console.log(gasUsed)

            // elementwise array multiplication
            let totalTransactionsFees =  multiply(gasPrice, gasUsed)

            // average price of gas as 1e9 BNB = 1 gwei
            const meanGasPrice = parseInt(mean(gasPrice)/1e9)

            // prepares dict with user-presenting values

            info["transactionsSent"] = transactionsSent.length
            info["gasPrice"] = gasPrice
            info["gasUsed"] = gasPriceTotal
            info["gasPriceTotal"] = gasUsed
            info["gasUsedTotal"] = gasUsedTotal
            info["totalTransactionsFees"] = totalTransactionsFees
            info["meanGasPrice"] = meanGasPrice

            axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd')
            .then(response => {
                console.log("bnb price in usd " + response.data.binancecoin.usd);
                info["bnbPrice"] = Number(response.data.binancecoin.usd)
                this.setState({ info : info }, function() { console.log("setState completed", this.state)})
                // this.setState({ info : info }, function() { console.log("setState completed", this.state)})
            })
            .catch(error => {
                console.log(error);
                this.setState({errorMsg: 'Error retrieving price data'})
            });

        })
        .catch(error => {
            console.log(error);
            this.setState({errorMsg: 'Error retrieving data. Have you installed Metamask?'})
        });
      }

    // TODO write number formatter
    // TODO confirm sender is address
    render() {
        // destructure the state property
        const { transactions, errorMsg, info} = this.state

        // console.log(this.state)

        // console.log(info["bnbPrice"])

        return (
            <div className="Transactions-body">
                <div className="Transactions-text">
                    {/* Total funds in account <span className="Transactions-value">{ (accountBalance * Math.pow(10, -18)).toFixed(3) }</span> BNB.
                    <br/> */}
                    You've spent <span className="Transactions-value">{(info["totalTransactionsFees"]/1e18).toFixed(3)}</span> BNB on gas. As of today, that's worth 
                    <span className="Transactions-value"> ${Number((info["bnbPrice"]*(info["totalTransactionsFees"]/1e18))).toLocaleString()}</span>
                    <br/>
                    <br/>
                    You've used <span className="Transactions-value">{Number(info["gasUsedTotal"]).toLocaleString()}</span> gas to send <span className="Transactions-value">{Number(info["transactionsSent"])}</span> transactions, with an average price of <span className="Transactions-value">{Number(info["meanGasPrice"]).toLocaleString()}</span> gwei.
                    <br/>
                    <p className="Transactions-tips">Consider a tip :D | 0x33F3a9845AF04022c3A9576494089a74c78d150c</p>
                    {/* NAN of them failed, costing you NAN. */}
                </div>
                
                { errorMsg ? <div>{errorMsg}</div> : null }
            </div>
        )
    }
}

export default Transactions
