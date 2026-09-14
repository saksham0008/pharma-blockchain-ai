import axios from "axios";

const API_BASE_URL = "https://pharma-backend-foox.onrender.com";

// ============================================================
// PUBLIC DRUG VERIFICATION
// ============================================================

export const getPublicDrug = async (drugID) => {
  const response = await axios.get(
    `${API_BASE_URL}/verify/${encodeURIComponent(drugID)}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  return response.data;
};

// ============================================================
// WALLET LOGIN
// ============================================================

export const loginWithWallet = async (
  walletAddress,
  signature,
  message
) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    {
      walletAddress,
      signature,
      message,
    }
  );

  return response.data;
};

// ============================================================
// QR GENERATION
// Requires Manufacturer/Admin JWT
// ============================================================

export const generateDrugQR = async (drugID, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/generateQR/${encodeURIComponent(drugID)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ============================================================
// GPS DATA
// ============================================================

export const getDrugGPS = async (drugID, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/drugs/${encodeURIComponent(drugID)}/gps`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ============================================================
// TRANSFER HISTORY
// ============================================================

export const getDrugHistory = async (drugID, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/drugs/${encodeURIComponent(drugID)}/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};