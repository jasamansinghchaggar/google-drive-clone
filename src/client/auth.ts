interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { success: false, error: data.error || "Registration failed" };
      } else {
        return { success: false, error: "Server error" };
      }
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { success: false, error: data.error || "Login failed" };
      } else {
        return { success: false, error: "Server error" };
      }
    }

    const data = await response.json();
    console.log(data);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/signout", {
      method: "POST",
    });

    if (!response.ok) {
      return { success: false, error: "Logout failed" };
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/profile");
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true, data: data.user };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}
