/**
 * Secrets Helper Utility
 * 
 * This utility provides functions for working with secrets and API keys.
 * It is used by the UI components to check if specific API keys are available.
 */

/**
 * Check if specific secrets are available in the environment
 * This is used by UI components to determine if API keys are available
 * 
 * @param secretKeys Array of secret keys to check
 * @returns Object with keys and boolean values indicating availability
 */
export async function checkSecrets(secretKeys: string[]): Promise<Record<string, boolean>> {
  try {
    // Call the API to check secrets
    const response = await fetch('/api/config/check-secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ secretKeys })
    });
    
    if (!response.ok) {
      // If API fails, assume keys are not available
      console.error('Failed to check secrets:', response.statusText);
      return secretKeys.reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    // If there's an error, assume keys are not available
    console.error('Error checking secrets:', error);
    return secretKeys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}