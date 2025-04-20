import { startSimulation } from './simulation.js';

// ISR code templates for different interrupt types
const isrTemplates = {
  keyboard: `// Keyboard Interrupt Service Routine
void keyboard_isr() {
  // Save additional registers if needed
  
  // Read the keyboard data port
  char scancode = port_read(0x60);
  
  // Process the keyboard input
  process_key_event(scancode);
  
  // Send EOI (End of Interrupt) to PIC
  port_write(0x20, 0x20);
  
  // Return from interrupt
  return;
}`,

  timer: `// Timer Interrupt Service Routine
void timer_isr() {
  // Update system tick count
  system_ticks++;
  
  // Check if time slice expired
  if (should_reschedule()) {
    // Trigger the scheduler
    schedule_next_process();
  }
  
  // Update system timers
  update_timers();
  
  // Send EOI (End of Interrupt) to PIC
  port_write(0x20, 0x20);
  
  // Return from interrupt
  return;
}`,

  io: `// I/O Interrupt Service Routine
void io_completion_isr() {
  // Identify the device that caused the interrupt
  int device_id = identify_io_device();
  
  // Read status registers
  int status = read_device_status(device_id);
  
  // Check for errors
  if (status & ERROR_FLAG) {
    handle_io_error(device_id, status);
  } else {
    // Process completed I/O operation
    complete_io_request(device_id);
    
    // Wake up waiting process
    wake_process(waiting_process[device_id]);
  }
  
  // Send EOI (End of Interrupt) to PIC
  port_write(0x20, 0x20);
  
  // Return from interrupt
  return;
}`,

  software: `// Software Interrupt Service Routine
void syscall_handler() {
  // Get the system call number from register
  int syscall_num = get_register(EAX);
  
  // Get parameters from other registers
  void* param1 = get_register(EBX);
  void* param2 = get_register(ECX);
  
  // Dispatch to appropriate system call handler
  switch(syscall_num) {
    case SYS_READ:
      handle_read(param1, param2);
      break;
    case SYS_WRITE:
      handle_write(param1, param2);
      break;
    // Other system calls...
    default:
      set_register(EAX, ERROR_INVALID_SYSCALL);
  }
  
  // Return from interrupt
  return;
}`,

  hardware: `// Hardware Error Interrupt Service Routine
void hardware_error_isr() {
  // Get error code
  int error_code = get_error_code();
  
  // Log the hardware error
  log_error("Hardware error detected", error_code);
  
  // Check if error is recoverable
  if (is_recoverable(error_code)) {
    // Attempt recovery
    bool recovered = recover_from_error(error_code);
    if (!recovered) {
      // If recovery failed, terminate affected process
      terminate_process(current_process, ERROR_HARDWARE_FAILURE);
    }
  } else {
    // Critical error - may require system halt
    if (error_code & CRITICAL_ERROR_MASK) {
      kernel_panic("Unrecoverable hardware error", error_code);
    } else {
      terminate_process(current_process, ERROR_HARDWARE_FAILURE);
    }
  }
  
  // Send EOI (End of Interrupt) if applicable
  port_write(0x20, 0x20);
  
  // Return from interrupt
  return;
}`
};

// Descriptions for each interrupt type
const interruptDescriptions = {
  keyboard: 'User pressed a key on the keyboard',
  timer: 'System timer triggered a periodic interrupt',
  io: 'An I/O device completed an operation',
  software: 'A program executed a system call instruction',
  hardware: 'A hardware error was detected by the CPU'
};

// Initialize interrupt buttons
export function setupInterrupts() {
  const interruptButtons = document.querySelectorAll('.interrupt-btn');
  
  interruptButtons.forEach(button => {
    button.addEventListener('click', () => {
      const interruptType = button.getAttribute('data-type');
      
      // Start the simulation with the selected interrupt
      startSimulation(
        interruptType, 
        isrTemplates[interruptType],
        interruptDescriptions[interruptType]
      );
      
      // Disable all interrupt buttons during simulation
      interruptButtons.forEach(btn => {
        btn.disabled = true;
      });
      
      // Add active state to the clicked button
      button.classList.add('active');
    });
  });
}

// Re-enable interrupt buttons
export function resetInterruptButtons() {
  const interruptButtons = document.querySelectorAll('.interrupt-btn');
  
  interruptButtons.forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('active');
  });
}