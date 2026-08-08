/**
 * Minimal typings for facebook-nodejs-business-sdk (ships without types).
 * Only the Conversions API surface Zeem uses.
 */
declare module "facebook-nodejs-business-sdk" {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
  }
  export class UserData {
    setPhones(phones: string[]): UserData;
    setFirstName(name: string): UserData;
    setClientIpAddress(ip: string): UserData;
    setClientUserAgent(ua: string): UserData;
    setCountry(country: string): UserData;
  }
  export class CustomData {
    setCurrency(currency: string): CustomData;
    setValue(value: number): CustomData;
    setContentIds(ids: string[]): CustomData;
    setContentType(type: string): CustomData;
    setNumItems(n: number): CustomData;
  }
  export class ServerEvent {
    setEventName(name: string): ServerEvent;
    setEventTime(time: number): ServerEvent;
    setEventId(id: string): ServerEvent;
    setUserData(data: UserData): ServerEvent;
    setCustomData(data: CustomData): ServerEvent;
    setEventSourceUrl(url: string): ServerEvent;
    setActionSource(source: string): ServerEvent;
  }
  export class EventRequest {
    constructor(accessToken: string, pixelId: string);
    setEvents(events: ServerEvent[]): EventRequest;
    setTestEventCode(code: string): EventRequest;
    execute(): Promise<unknown>;
  }
}
