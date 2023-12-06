import React, { useEffect, useState } from "react";
import {
  getUsers,
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

type User = {
  id: number;
  name: string;
};

type UserReading = {
  id: number;
  timestamp: string;
  user_id: number;
  value: number;
  torquevalues: number[];
  asmtimes: number[];
  motionwastes: number[];
  setvalue: number;
};

export default function UserReadingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [readings, setReadings] = useState<UserReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadingsForUser = async (userId: number) => {
    try {
       setLoading(true);
       const readingsData = await getReadingsByUser(userId);
       setReadings(readingsData);
    } catch (error) {
       console.error("Error fetching readings for user:", error);
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId !== null) {
      fetchReadingsForUser(selectedUserId);
    }
  }, [selectedUserId]);

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
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Torque Values</TableHead>
                  <TableHead>Asm Times</TableHead>
                  <TableHead>Motion Wastes</TableHead>
                  <TableHead>Set Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">
                      {reading.user_id}
                    </TableCell>
                    <TableCell>{reading.torquevalues.join(", ")}</TableCell>
                    <TableCell>{reading.asmtimes.join(", ")}</TableCell>
                    <TableCell>{reading.motionwastes.join(", ")}</TableCell>
                    <TableCell>{reading.setvalue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

