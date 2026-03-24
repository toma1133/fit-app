import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useStore } from '../store/useStore';

export const useFirestore = <T = any>(collectionName: string) => {
	const { user } = useStore();
	const [data, setData] = useState<T[]>([]);

	useEffect(() => {
		if (!user) return;
		const colRef = collection(db, 'users', user.uid, collectionName);
		const unsubscribe = onSnapshot(colRef, (snapshot) => {
			setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[]);
		}, console.error);
		return () => unsubscribe();
	}, [user, collectionName]);

	const docRef = (docId: string) => doc(db, 'users', user?.uid || '', collectionName, docId);

	const addOrUpdateDoc = async (docId: string, payload: any) => {
		if (!user) return;
		await setDoc(docRef(docId), payload);
	};

	const removeDoc = async (docId: string) => {
		if (!user) return;
		await deleteDoc(docRef(docId));
	};

	return { data, addOrUpdateDoc, removeDoc };
};
