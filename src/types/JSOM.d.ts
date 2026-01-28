/**
 * TypeScript definitions for SharePoint JavaScript Object Model (JSOM)
 * Social Following API
 */

declare namespace SP {
  namespace Social {
    /**
     * Social actor type enumeration
     */
    enum SocialActorType {
      document = 1,
      site = 2,
      tag = 3,
      user = 4
    }

    /**
     * Social follow result enumeration
     */
    enum SocialFollowResult {
      ok = 0,
      alreadyFollowing = 1,
      limitReached = 2,
      internalError = 3
    }

    /**
     * Social actor information
     */
    class SocialActorInfo {
      /**
       * Gets or sets the actor type
       */
      get_actorType(): SocialActorType;
      set_actorType(value: SocialActorType): void;

      /**
       * Gets or sets the content URI
       */
      get_contentUri(): string;
      set_contentUri(value: string): void;

      /**
       * Gets or sets the actor ID
       */
      get_id(): string;
      set_id(value: string): void;
    }

    /**
     * Social following manager for following/unfollowing content
     */
    class SocialFollowingManager {
      /**
       * Creates a new instance of SocialFollowingManager
       * @param context - SharePoint client context
       */
      constructor(context: SP.ClientContext);

      /**
       * Start following an actor (site, document, tag, etc.)
       * @param actor - Social actor information
       * @returns SocialFollowResult indicating the result
       */
      follow(actor: SocialActorInfo): SocialFollowResult;

      /**
       * Stop following an actor
       * @param actor - Social actor information
       */
      stopFollowing(actor: SocialActorInfo): void;

      /**
       * Check if currently following an actor
       * @param actor - Social actor information
       * @returns ClientResult<boolean> indicating if following
       */
      isFollowed(actor: SocialActorInfo): ClientResult<boolean>;

      /**
       * Get followed content
       * @param types - Bitmask of actor types to retrieve (2=documents, 4=sites, 8=tags)
       * @returns ClientObjectCollection of SocialActor objects
       */
      getFollowed(types: number): ClientObjectCollection<SocialActor>;

      /**
       * Get followed count
       * @param types - Bitmask of actor types to count
       * @returns Number of followed items
       */
      getFollowedCount(types: number): number;
    }

    /**
     * Social actor object returned from getFollowed
     */
    class SocialActor {
      /**
       * Gets the actor type
       */
      get_actorType(): SocialActorType;

      /**
       * Gets the content URI
       */
      get_contentUri(): string;

      /**
       * Gets the actor ID
       */
      get_id(): string;

      /**
       * Gets the actor name
       */
      get_name(): string;

      /**
       * Gets the actor URI
       */
      get_uri(): string;
    }
  }

  /**
   * Client result wrapper for JSOM operations
   */
  class ClientResult<T> {
    /**
     * Gets the value from the result
     */
    get_value(): T;
  }

  /**
   * Client object collection for JSOM operations
   */
  class ClientObjectCollection<T> {
    /**
     * Gets an enumerator for iterating through the collection
     */
    getEnumerator(): ClientObjectCollectionEnumerator<T>;
  }

  /**
   * Enumerator for client object collections
   */
  class ClientObjectCollectionEnumerator<T> {
    /**
     * Moves to the next item in the collection
     * @returns true if there is a next item, false otherwise
     */
    moveNext(): boolean;

    /**
     * Gets the current item in the collection
     */
    get_current(): T;
  }

  /**
   * SharePoint client context
   */
  class ClientContext {
    /**
     * Gets the current client context
     */
    static get_current(): ClientContext;

    /**
     * Executes the query asynchronously
     * @param succeededCallback - Success callback
     * @param failedCallback - Failure callback
     */
    executeQueryAsync(
      succeededCallback: (sender: unknown, args: SP.ClientRequestSucceededEventArgs) => void,
      failedCallback: (sender: unknown, args: SP.ClientRequestFailedEventArgs) => void
    ): void;

    /**
     * Loads the specified client object
     * @param clientObject - Client object to load
     * @param clientObjectPropertyPaths - Property paths to load
     */
    load(clientObject: unknown, ...clientObjectPropertyPaths: string[]): void;
  }

  namespace Client {
    /**
     * Client request succeeded event arguments
     */
    interface ClientRequestSucceededEventArgs {
      /**
       * Gets the sender of the request
       * @returns The sender object (typically ClientContext)
       */
      get_sender(): unknown;
    }

    /**
     * Client request failed event arguments
     */
    interface ClientRequestFailedEventArgs {
      get_message(): string;
      get_errorCode(): number;
      get_errorTypeName(): string;
      get_errorValue(): string;
      get_stackTrace(): string;
    }
  }
}
