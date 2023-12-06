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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type User = {
  id: number;
  name: string;
  rfid: string;
  categoria: string;
  matricula: string;
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
  console.log(readings);
  const fetchReadingsForUser = async (userId: number) => {
    try {
      setLoading(true);
      const readingsData = await getReadingsByUser(userId.toString());
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

      const readingsData = await getReadings();
      setReadings(readingsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
                <h1 className="text-xl font-semibold">Torquimetro Digital</h1>
              </div>
            </div>
            {loading && <div>Loading ...</div>}
          </div>
        </div>
      </div>
      <div className="flex space-y-8 p-20 flex-col min-h-screen py-8 bg-gray-800">
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Clique para filtrar as leituras por usuário
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Rfid</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Matricula</TableHead>
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
                    <TableCell>{user.rfid}</TableCell>
                    <TableCell>{user.categoria}</TableCell>
                    <TableCell>{user.matricula}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
                  <TableHead className="text-right">Set Value</TableHead>
                  <TableHead className="text-right">Torque Values</TableHead>
                  <TableHead className="text-right">Asm Times</TableHead>
                  <TableHead className="text-right">Motion Wastes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* {loading && (
                  <Skeleton className="w-[100px] h-[20px] rounded-full" />
                )} */}
                {readings !== null && readings.length > 0 ? (
                  readings.map((reading) => (
                    <TableRow className="hover:bg-sky-900" key={reading.id}>
                      <TableCell className="font-medium">
                        {reading.id}
                      </TableCell>
                      <TableCell>{reading.timestamp}</TableCell>
                      <TableCell className="w-[100px]">
                        {reading.user_id}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.value}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.set_value}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.torque_values.join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.asm_times.join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.motion_wastes.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Nenhuma leitura encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
