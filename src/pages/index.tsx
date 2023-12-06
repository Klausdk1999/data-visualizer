import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUsers,
  getReadings,
  getReadingsByUser,
} from "@/lib/requestHandlers";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type User = {
  id: number;
  name: string;
};

type Reading = {
  id: number;
  timestamp: string;
  user_id: number;
  value: number;
  torque_values: number[];
  asm_times: number[];
  motion_wastes: number[];
  set_value: number;
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[] | null>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadingsForUser = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/userReadings?user_id=${userId}`);
      const readingsData = await response.json();
      setReadings(readingsData);
    } catch (error) {
      console.error("Error fetching readings for user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/readings");
      const readingsData = await response.json();
      setReadings(readingsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createReading = async (newReading: Reading) => {
    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReading),
      });

      if (!response.ok) {
        throw new Error("Failed to create reading");
      }
    } catch (error) {
      console.error("Error creating reading:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReadings();
  }, []);

  useEffect(() => {
    if (selectedUserId !== null) {
      fetchReadingsForUser(selectedUserId);
    } else {
      fetchReadings();
    }
  }, [selectedUserId]);

  const handleUserClick = (userId: number) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      return;
    }
    setSelectedUserId(userId);
  };

 return (
  <>
    <div className="w-full bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold">Torquimetro</h1>
            </div>
          </div>
          {loading && <div>Loading ...</div>}
          {error && <div className="text-red-500">{error}</div>}
        </div>
      </div>
    </div>

    <div className="flex space-y-8 p-20 flex-col min-h-screen py-8 bg-gray-800">
      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Clique para filtrar as leituras por usuário</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  className="hover:bg-sky-900 cursor-pointer"
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUserId === user.id}
                      onChange={() => handleUserClick(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Tabela de Leituras */}
      <Card>
        <CardHeader>
          <CardTitle>Leituras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Leituras de torque</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Quando</TableHead>
                <TableHead className="w-[100px]">ID de usuário</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : readings && readings.length > 0 ? (
                readings.map((reading) => (
                  <TableRow className="hover:bg-sky-900" key={reading.id}>
                    <TableCell className="font-medium">{reading.id}</TableCell>
                    <TableCell>{reading.timestamp}</TableCell>
                    <TableCell>{reading.user_id}</TableCell>
                    <TableCell className="text-right">{reading.value}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Nenhuma leitura encontrada</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </>
);
};