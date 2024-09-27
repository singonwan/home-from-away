'use server';

import {
	imageSchema,
	profileSchema,
	propertySchema,
	validateWithZodScehma,
} from './schemas';
import db from './db';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadImage } from './supabase';

const getAuthUser = async () => {
	const user = await currentUser();
	if (!user) {
		throw new Error('You must be logged in to access this route');
	}
	if (!user.privateMetadata.hasProfile) redirect('/profile/create');

	// all good
	return user;
};

const renderError = (error: unknown): { message: string } => {
	console.log(error);
	return {
		message: error instanceof Error ? error.message : 'An error occurred',
	};
};

export const createProfileAction = async (
	prevState: any,
	formData: FormData
) => {
	try {
		const user = await currentUser();
		if (!user) throw new Error('Please login to create a profile');
		// console.log(user);
		const rawData = Object.fromEntries(formData);
		const validatedFields = validateWithZodScehma(profileSchema, rawData);

		await db.profile.create({
			data: {
				clerkId: user.id,
				email: user.emailAddresses[0].emailAddress,
				profileImage: user.imageUrl ?? '',
				...validatedFields,
			},
		});

		await clerkClient.users.updateUserMetadata(user.id, {
			privateMetadata: {
				hasProfile: true,
			},
		});
	} catch (error) {
		// console.log(error);
		return renderError(error);
	}
	redirect('/');
};

export const fetchProfileImage = async () => {
	const user = await currentUser();
	if (!user) return null;

	const profile = await db.profile.findUnique({
		where: {
			clerkId: user.id,
		},
		select: {
			profileImage: true,
		},
	});

	return profile?.profileImage;
};

export const fetchProfile = async () => {
	const user = await getAuthUser();

	const profile = await db.profile.findUnique({
		where: {
			clerkId: user.id,
		},
	});
	if (!profile) redirect('/profile/create');
	return profile;
};

export const updateProfileAction = async (
	prevState: any,
	formData: FormData
): Promise<{ message: string }> => {
	const user = await getAuthUser();

	try {
		const rawData = Object.fromEntries(formData);
		const validatedFields = validateWithZodScehma(profileSchema, rawData);

		await db.profile.update({
			where: {
				clerkId: user.id,
			},
			data: validatedFields,
		});

		revalidatePath('/profile');
		return { message: 'Profile updated successfully' };
	} catch (error) {
		return renderError(error);
	}
};

export const updateProfileImageAction = async (
	prevState: any,
	formData: FormData
): Promise<{ message: string }> => {
	const user = await getAuthUser();
	try {
		const image = formData.get('image') as File;
		const validatedFields = validateWithZodScehma(imageSchema, { image });
		const fullPath = await uploadImage(validatedFields.image);

		// should be deleting old profile image - good practice

		await db.profile.update({
			where: {
				clerkId: user.id,
			},
			data: {
				profileImage: fullPath,
			},
		});

		revalidatePath('/profile');
		return { message: 'Profile image updated successfully' };
	} catch (error) {
		return renderError(error);
	}
};

export const createPropertyAction = async (
	prevState: any,
	formData: FormData
): Promise<{ message: string }> => {
	const user = await getAuthUser();

	try {
		const rawData = Object.fromEntries(formData);
		const file = formData.get('image') as File;

		const validatedFields = validateWithZodScehma(propertySchema, rawData);
		const validatedFile = validateWithZodScehma(imageSchema, { image: file });
		const fullPath = await uploadImage(validatedFile.image);

		await db.property.create({
			data: {
				...validatedFields,
				image: fullPath,
				profileId: user.id,
			},
		});
	} catch (error) {
		return renderError(error);
	}
	redirect('/');
};

export const fetchProperties = async ({
	search = '',
	category,
}: {
	search?: string;
	category?: string;
}) => {
	const properties = await db.property.findMany({
		where: {
			category,
			OR: [
				{ name: { contains: search, mode: 'insensitive' } },
				{ tagline: { contains: search, mode: 'insensitive' } },
			],
		},
		select: {
			id: true,
			image: true,
			name: true,
			tagline: true,
			country: true,
			price: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
	return properties;
};
