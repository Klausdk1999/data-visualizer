// pages/api/torqueData.ts
import type { NextApiRequest, NextApiResponse } from "next";

type TorqueData = {
  Routine:string;
  TorqueValues: number[];
  AsmTimes: number[];
  MotionWastes: number[];
  SetValue: number;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TorqueData[] | { message: string }>
) {
  if (req.method === "GET") {
    pool.query("SELECT * FROM sua_tabela_de_torque", (err, results) => {
      if (err) {
        // Tratar o erro adequadamente
        res.status(500).json({ message: "Erro ao acessar o banco de dados" });
        return;
      }
      // Supondo que 'results' contém seus dados de torque no formato necessário
      res.status(200).json(results);
    });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
