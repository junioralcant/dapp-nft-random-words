import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import './App.css';

import myEpicNFT from './utils/MyEpicNFT.json';

declare global {
  interface Window {
    ethereum: import('ethers').providers.ExternalProvider;
  }
}

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [messageToUser, setmessageToUser] = useState('');
  const [totalNFTMinted, setTotalNFTMinted] = useState(0);
  const [updatetotalNFTMinted, setUpdateTotalNFTMinted] =
    useState(false);

  const { ethereum } = window;

  // Constants
  const TWITTER_HANDLE = '@jrrmarques';
  const TWITTER_LINK = `https://www.instagram.com/${TWITTER_HANDLE}`;

  const CONTRACT_ADDRESS =
    '0x267e8AeA7D198234749B25fAa9d87c63c5a29F59';

  useEffect(() => {
    async function checkIfWalletIsConnected() {
      if (!ethereum) {
        console.log(
          'Certifique-se que você tem a MetaMask instalada!'
        );
        return;
      } else {
        console.log('Temos o objeto ethereum!', ethereum);
      }

      const accounts = await ethereum.request!({
        method: 'eth_accounts',
      });

      /*
       * Usuário pode ter múltiplas carteiras autorizadas, nós podemos pegar a primeira que está lá!
       */
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Encontrou uma conta autorizada:', account);
        setCurrentAccount(account);

        // Setup listener! Isso é para quando o usuário vem no site
        // e já tem a carteira conectada e autorizada
      } else {
        console.log('Nenhuma conta autorizada foi encontrada');
      }

      let chainId = await ethereum.request!({
        method: 'eth_chainId',
      });
      console.log('Conectado à rede ' + chainId);
      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = '0x4';
      if (chainId !== rinkebyChainId) {
        alert('Você não está conectado a rede Rinkeby de teste!');
      }
    }
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    async function searchNFTAmount() {
      try {
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(
            ethereum
          );
          const signer = provider.getSigner();

          const connectContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            myEpicNFT.abi,
            signer
          );

          let totalNFTMinted =
            await connectContract.getTotalNFTMinted();

          console.log(
            'Total NFT cunhados',
            totalNFTMinted.toNumber()
          );

          setTotalNFTMinted(totalNFTMinted.toNumber());
        }
      } catch (error) {
        setmessageToUser('');
        console.log(error);
      }
    }
    searchNFTAmount();
  }, [updatetotalNFTMinted]);

  async function connectWallet() {
    try {
      if (!ethereum) {
        alert('Baixe a MetaMask');
        return;
      }

      // Pede acesso a conta
      const accounts = await ethereum.request!({
        method: 'eth_requestAccounts',
      });

      setCurrentAccount(accounts[0]);
      console.log('Conectado', accounts[0]);

      // Setup listener! Isso é para quando o usuário vem no site
      // e já tem a carteira conectada e autorizada
    } catch (error) {
      console.log(error);
    }
  }

  // Setup do listener.
  const setupEventListener = async () => {
    // é bem parecido com a função
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNFT.abi,
          signer
        );

        // Aqui está o tempero mágico.
        // Isso essencialmente captura nosso evento quando o contrato lança
        // Se você está familiar com webhooks, é bem parecido!
        connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Olá! Já cunhamos seu NFT. Pode ser que esteja branco agora. Demora no máximo 10 minutos para aparecer no OpenSea. Aqui está o link: <https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}>`
          );
        });

        console.log('Setup event listener!');
      } else {
        console.log('Objeto ethereum não existe!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function askContractToMintNft() {
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const connectContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNFT.abi,
          signer
        );

        setmessageToUser('Carregando...');

        let nftTxn = await connectContract.makeAnEpicNFT();

        setmessageToUser('Cunhando... espere por favor.');

        await nftTxn.wait();

        setUpdateTotalNFTMinted(updatetotalNFTMinted!);
        setupEventListener();
        setmessageToUser('');
      } else {
        setmessageToUser('');
        console.log('Objeto ethereum não existe!');
      }
    } catch (error) {
      setmessageToUser('');
      console.log(error);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Minha Coleção de NFT</p>
          <p className="sub-text">
            Exclusivos! Maravilhosos! Únicos! Descubra seu NFT hoje.
          </p>
          <p className="sub-text">
            Total de NFTs Cunhados - {totalNFTMinted}/50
          </p>

          {currentAccount === '' ? (
            <button
              onClick={connectWallet}
              className="cta-button connect-wallet-button"
            >
              Conectar Carteira
            </button>
          ) : (
            /** Adiciona askContractToMintNFT Action para o evento onClick **/
            <button
              onClick={askContractToMintNft}
              className="cta-button connect-wallet-button"
              disabled={!!messageToUser}
            >
              {messageToUser ? messageToUser : 'Cunhar NFT'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
