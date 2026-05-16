import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../contractABI";

export function useContract() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readContract, setReadContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected. Please install MetaMask.");
      if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS is not set in .env");

      const _provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await _provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) throw new Error("No accounts returned from MetaMask.");

      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();

      // Use a public RPC for reads so it works regardless of MetaMask network state
      const _readProvider = new ethers.JsonRpcProvider(
        "https://ethereum-sepolia-rpc.publicnode.com"
      );
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _signer);
      const _readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, _readProvider);

      const ownerAddress = await _readContract.owner();
      const _isOwner = ownerAddress.toLowerCase() === _address.toLowerCase();
      const _isIssuer = await _readContract.isAuthorizedIssuer(_address);

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setReadContract(_readContract);
      setAddress(_address);
      setIsOwner(_isOwner);
      setIsIssuer(_isIssuer || _isOwner);
    } catch (err) {
      console.error("Connect error:", err);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  // Auto-reconnect if already authorized
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts && accounts.length > 0) connect();
    }).catch(console.error);

    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        // wallet disconnected
        setAddress(null);
        setContract(null);
        setReadContract(null);
        setIsOwner(false);
        setIsIssuer(false);
      } else {
        connect();
      }
    });
    window.ethereum.on("chainChanged", () => window.location.reload());
  }, [connect]);

  return { provider, signer, contract, readContract, address, isOwner, isIssuer, error, connecting, connect };
}
