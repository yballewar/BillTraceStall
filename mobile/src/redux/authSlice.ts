import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { clearAuth, getAccessToken, getRole, setAuth } from '../services/storage';
import type { AxiosError } from 'axios';

export type UserRole = 'Admin' | 'TeaStallOwner' | 'DeliveryBoy' | 'Office';

type AuthState = {
  status: 'idle' | 'loading' | 'authenticated';
  phone: string;
  role: UserRole | null;
};

const initialState: AuthState = {
  status: 'idle',
  phone: '',
  role: null,
};

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const role = (await getRole()) as UserRole | null;
  const token = await getAccessToken();
  if (!role || !token) {
    await clearAuth();
    return { role: null as UserRole | null };
  }
  return { role };
});

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (
    payload: {
      phone: string;
      mode: 'login' | 'register';
      name?: string;
      role?: UserRole;
      address?: string;
      designationName?: string;
      stallName?: string;
      stallAddress?: string;
      city?: string;
      state?: string;
      pincode?: string;
    },
    thunkApi
  ) => {
    try {
      if (payload.mode === 'register') {
        await api.post('auth/register', {
          name: payload.name,
          phone: payload.phone,
          role: payload.role,
          address: payload.address ?? null,
          designationName: payload.designationName ?? null,
          stallName: payload.stallName ?? null,
          stallAddress: payload.stallAddress ?? null,
          city: payload.city ?? null,
          state: payload.state ?? null,
          pincode: payload.pincode ?? null,
        });
      } else {
        await api.post('auth/login', { phone: payload.phone });
      }
      return { phone: payload.phone };
    } catch (e) {
      const err = e as AxiosError<any>;
      const message = err.response?.data?.error ?? err.message ?? 'Network Error';
      return thunkApi.rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (payload: { phone: string; otp: string }, thunkApi) => {
  try {
    const { data } = await api.post('auth/verify-otp', payload);
    const accessToken: string = data.accessToken;
    const role: UserRole = data.role;
    await setAuth(accessToken, role);
    return { role };
  } catch (e) {
    const err = e as AxiosError<any>;
    const message = err.response?.data?.error ?? err.message ?? 'Network Error';
    return thunkApi.rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearAuth();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhone(state, action: PayloadAction<string>) {
      state.phone = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        if (action.payload.role) {
          state.role = action.payload.role;
          state.status = 'authenticated';
        }
      })
      .addCase(requestOtp.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.status = 'idle';
        state.phone = action.payload.phone;
      })
      .addCase(requestOtp.rejected, (state) => {
        state.status = 'idle';
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.role = action.payload.role;
      })
      .addCase(verifyOtp.rejected, (state) => {
        state.status = 'idle';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.role = null;
        state.phone = '';
      });
  },
});

export const { setPhone } = authSlice.actions;
export const authReducer = authSlice.reducer;
