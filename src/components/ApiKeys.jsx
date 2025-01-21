import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
} from "@mui/material";
import axios from "axios";

const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState({
    serper_api_key: "",
    openai_api_key: "",
  });
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api-keys`
      );
      if (response.data) {
        setApiKeys(response.data);
      } else if (response.message) {
        setStatus({
          message: response.message,
          type: "error",
        });
      }
    } catch (error) {
      if (error.response.data.message) {
        if (error.status != 404) {
          setStatus({
            message: error.response.data.message,
            type: "error",
          });
        }
      } else {
        setStatus({
          message: "Failed to fetch API keys",
          type: "error",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api-keys`, apiKeys);
      setStatus({
        message: "API keys updated successfully",
        type: "success",
      });
    } catch (error) {
      setStatus({
        message: error.response?.data?.message || "Failed to update API keys",
        type: "error",
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your API keys?"))
      return;

    setLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api-keys`);
      setApiKeys({
        serper_api_key: "",
        openai_api_key: "",
      });
      setStatus({
        message: "API keys deleted successfully",
        type: "success",
      });
    } catch (error) {
      setStatus({
        message: "Failed to delete API keys",
        type: "error",
      });
    }
    setLoading(false);
  };

  return (
    <Grid container justifyContent="center" spacing={2}>
      <Grid item xs={12} md={8} lg={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              API Keys Management
            </Typography>

            {status.message && (
              <Alert
                severity={status.type}
                sx={{ mb: 2 }}
                onClose={() => setStatus({ message: "", type: "" })}
              >
                {status.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Serper API Key"
                fullWidth
                margin="normal"
                value={apiKeys.serper_api_key}
                onChange={(e) =>
                  setApiKeys((prev) => ({
                    ...prev,
                    serper_api_key: e.target.value,
                  }))
                }
                // type="password"
              />

              <TextField
                label="OpenAI API Key"
                fullWidth
                margin="normal"
                value={apiKeys.openai_api_key}
                onChange={(e) =>
                  setApiKeys((prev) => ({
                    ...prev,
                    openai_api_key: e.target.value,
                  }))
                }
                // type="password"
              />

              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save API Keys"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete API Keys
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ApiKeys;
