// pages/torque-data.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const TorqueDataPage = () => {
  const [torqueData, setTorqueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTorqueData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/torqueData"); // endpoint 
        setTorqueData(response.data);
      } catch (error) {
        console.error("Error fetching torque data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTorqueData();
  }, []);


    return (
    <div className="container">
        <h1 className="title">ITW30_001</h1>
        <div className="operator">Operador: João Silva</div>
        <div className="routine">Rotina: RN_001_30_3</div>

        {loading ? (
        <p>Loading...</p>
        ) : (
        torqueData.map((data, index) => (
            <div className="card" key={data.id}>
            <div className="card-header">{`${index + 1}/3`}</div>
            <div className="card-body">
                <div className="torque">Torque: {data.torqueValue} N.m</div>
                <div className="set">Set: {data.set} N.m</div>
                <div className="assembly-time">Tempo de montagem: {data.assemblyTime} ms</div>
                <div className="waste-time">Tempo gasto: {data.wasteTime} ms</div>
            </div>
            </div>
        ))
        )}
    </div>
    );
    

export default TorqueDataPage;
