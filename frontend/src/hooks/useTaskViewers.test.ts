import { renderHook, act } from '@testing-library/react';
import { useTaskViewers } from './useTaskViewers';
import { useAuthStore } from '../store/authStore';
import socketService from '../services/socket';

jest.mock('../store/authStore');
jest.mock('../services/socket');

const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockedSocketService = socketService as jest.Mocked<typeof socketService>;

describe('useTaskViewers', () => {
  const mockUser = {
    id: 'current-user',
    first_name: 'Current',
    last_name: 'User',
    email: 'current@example.com',
    role: 'member' as const,
  };

  const mockViewer = {
    id: 'viewer-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    avatar_url: null,
  };

  beforeEach(() => {
    mockedUseAuthStore.mockReturnValue({ user: mockUser } as any);
    Object.defineProperty(mockedSocketService, 'connected', { value: true, configurable: true });
    mockedSocketService.joinTask.mockClear();
    mockedSocketService.leaveTask.mockClear();
    mockedSocketService.onUserViewingTask.mockClear();
    mockedSocketService.onUserStoppedViewingTask.mockClear();
    mockedSocketService.off.mockClear();
  });

  it('should initialize with empty viewers', () => {
    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(result.current.viewers).toEqual([]);
  });

  it('should join task when enabled and taskId provided', () => {
    renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(mockedSocketService.joinTask).toHaveBeenCalledWith('task-1');
  });

  it('should not join task when disabled', () => {
    renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: false })
    );

    expect(mockedSocketService.joinTask).not.toHaveBeenCalled();
  });

  it('should not join task when no taskId provided', () => {
    renderHook(() => 
      useTaskViewers({ enabled: true })
    );

    expect(mockedSocketService.joinTask).not.toHaveBeenCalled();
  });

  it('should not join task when user is not authenticated', () => {
    mockedUseAuthStore.mockReturnValue({ user: null } as any);

    renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(mockedSocketService.joinTask).not.toHaveBeenCalled();
  });

  it('should not join task when socket is not connected', () => {
    Object.defineProperty(mockedSocketService, 'connected', { value: false, configurable: true });

    renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(mockedSocketService.joinTask).not.toHaveBeenCalled();
  });

  it('should leave task on unmount', () => {
    const { unmount } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    unmount();

    expect(mockedSocketService.leaveTask).toHaveBeenCalledWith('task-1');
  });

  it('should set up socket listeners', () => {
    renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(mockedSocketService.onUserViewingTask).toHaveBeenCalled();
    expect(mockedSocketService.onUserStoppedViewingTask).toHaveBeenCalled();
  });

  it('should clean up socket listeners on unmount', () => {
    const { unmount } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    unmount();

    expect(mockedSocketService.off).toHaveBeenCalledWith(
      'user_viewing_task', 
      expect.any(Function)
    );
    expect(mockedSocketService.off).toHaveBeenCalledWith(
      'user_stopped_viewing_task', 
      expect.any(Function)
    );
  });

  it('should add viewer when receiving viewing event for same task', () => {
    let handleUserViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    act(() => {
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([mockViewer]);
  });

  it('should not add viewer for different task', () => {
    let handleUserViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    act(() => {
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-2',
      });
    });

    expect(result.current.viewers).toEqual([]);
  });

  it('should not add current user as viewer', () => {
    let handleUserViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    act(() => {
      handleUserViewingTask!({
        user: mockUser,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([]);
  });

  it('should remove viewer when receiving stopped viewing event', () => {
    let handleUserViewingTask: (data: any) => void;
    let handleUserStoppedViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    mockedSocketService.onUserStoppedViewingTask.mockImplementation((callback) => {
      handleUserStoppedViewingTask = callback;
    });

    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    // Add viewer first
    act(() => {
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([mockViewer]);

    // Remove viewer
    act(() => {
      handleUserStoppedViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([]);
  });

  it('should not add duplicate viewers', () => {
    let handleUserViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    // Add viewer twice
    act(() => {
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([mockViewer]);
  });

  it('should clear viewers when task changes', () => {
    let handleUserViewingTask: (data: any) => void;

    mockedSocketService.onUserViewingTask.mockImplementation((callback) => {
      handleUserViewingTask = callback;
    });

    const { result, rerender } = renderHook(
      ({ taskId }) => useTaskViewers({ taskId, enabled: true }),
      { initialProps: { taskId: 'task-1' } }
    );

    // Add viewer to task-1
    act(() => {
      handleUserViewingTask!({
        user: mockViewer,
        task_id: 'task-1',
      });
    });

    expect(result.current.viewers).toEqual([mockViewer]);

    // Change to task-2
    rerender({ taskId: 'task-2' });

    expect(result.current.viewers).toEqual([]);
  });

  it('should provide utility functions', () => {
    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    expect(typeof result.current.addViewer).toBe('function');
    expect(typeof result.current.removeViewer).toBe('function');
    expect(typeof result.current.clearViewers).toBe('function');
  });

  it('should allow manual viewer manipulation', () => {
    const { result } = renderHook(() => 
      useTaskViewers({ taskId: 'task-1', enabled: true })
    );

    // Add viewer manually
    act(() => {
      result.current.addViewer(mockViewer);
    });

    expect(result.current.viewers).toEqual([mockViewer]);

    // Remove viewer manually
    act(() => {
      result.current.removeViewer(mockViewer.id);
    });

    expect(result.current.viewers).toEqual([]);

    // Clear all viewers manually
    act(() => {
      result.current.addViewer(mockViewer);
      result.current.clearViewers();
    });

    expect(result.current.viewers).toEqual([]);
  });
});